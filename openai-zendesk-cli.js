const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { createPatch } = require('diff');
const axios = require('axios');

const CONFIG_PATH = path.join(__dirname, 'spacex-zendesk-config.json');
const AUTOMATION_SCRIPT = path.join(__dirname, 'zendesk-demo-automation.js');

// Zendesk API configuration
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN;

if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
  console.error(chalk.red('✖ Missing Zendesk credentials in .env'));
  process.exit(1);
}

const zendeskBaseUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2`;
const helpCenterBaseUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/help_center`;
const auth = {
  username: `${ZENDESK_EMAIL}/token`,
  password: ZENDESK_API_TOKEN,
};

async function proposeAndApplyConfigChange() {
  // 1. Prompt for user input
  console.log(
    chalk.cyan('Step 1: Prompting for your Zendesk config update request...')
  );
  const { userPrompt } = await inquirer.prompt([
    {
      type: 'input',
      name: 'userPrompt',
      message: chalk.yellow(
        'Describe the macros, views, or custom objects you want to add/update:'
      ),
      validate: (input) => input.trim().length > 0 || 'Please enter a prompt.',
    },
  ]);
  console.log(chalk.green('✔ User prompt received.'));

  // 2. Read current config
  console.log(chalk.cyan('Step 2: Reading current config...'));
  let currentConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      currentConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      console.log(chalk.green('✔ Current config loaded.'));
    } catch (e) {
      console.error(
        chalk.red('✖ Error reading spacex-zendesk-config.json:'),
        e.message
      );
      process.exit(1);
    }
  } else {
    console.log(
      chalk.yellow('⚠ No existing config found, starting with empty config.')
    );
  }

  // 3. Prepare prompt for OpenAI
  console.log(chalk.cyan('Step 3: Preparing prompt for OpenAI...'));
  const systemPrompt = `You are an expert Zendesk admin. Given the current Zendesk config JSON and a user request, generate a new config JSON that adds or updates macros, views, and custom objects as requested. Only return the full, valid JSON. Do not include explanations. DO not include the word "json" at the beginning or end of your response. Only return the JSON, no other text. DO not create an "id" field for any macro, view, or custom object.`;
  const promptData = [
    ['system', systemPrompt],
    [
      'human',
      `Current config JSON: ${JSON.stringify(currentConfig)
        .replaceAll('{', '{{')
        .replaceAll('}', '}}')}`,
    ],
    ['human', `User request: ${userPrompt}`],
  ];
  const prompt = ChatPromptTemplate.fromMessages(promptData);

  // 4. Call OpenAI via Langchain
  console.log(
    chalk.cyan('Step 4: Calling OpenAI to generate proposed config...')
  );
  const openai = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.2,
    modelName: 'gpt-4o',
  });
  let proposedConfigStr;
  try {
    const chain = prompt.pipe(openai);
    proposedConfigStr = await chain.invoke({});
    console.log(chalk.green('✔ OpenAI response received.'));
  } catch (e) {
    console.error(chalk.red('✖ Error communicating with OpenAI:'), e.message);
    process.exit(1);
  }

  // 5. Parse and diff
  console.log(chalk.cyan('Step 5: Parsing and diffing proposed config...'));
  let proposedConfig;
  try {
    proposedConfig = JSON.parse(proposedConfigStr.content);
    console.log(chalk.green('✔ Proposed config is valid JSON.'));
  } catch (e) {
    console.error(
      chalk.red('✖ OpenAI did not return valid JSON. Output was:\n'),
      proposedConfigStr
    );
    process.exit(1);
  }
  const oldStr = JSON.stringify(currentConfig, null, 2);
  const newStr = JSON.stringify(proposedConfig, null, 2);
  const diff = createPatch('spacex-zendesk-config.json', oldStr, newStr);

  // 6. Show diff and ask for approval
  console.log(chalk.cyan('\nProposed changes to spacex-zendesk-config.json:'));
  console.log(chalk.yellow(diff));
  const { approve } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'approve',
      message: chalk.yellow('Apply these changes?'),
      default: false,
    },
  ]);
  if (!approve) {
    console.log(chalk.red('✖ No changes applied.'));
    return false;
  }
  console.log(chalk.green('✔ Changes approved.'));

  // 7. Write new config
  console.log(chalk.cyan('Step 7: Writing new config...'));
  try {
    fs.writeFileSync(CONFIG_PATH, newStr);
    console.log(chalk.green('✔ Config updated.'));
  } catch (e) {
    console.error(chalk.red('✖ Failed to write config:'), e.message);
    process.exit(1);
  }
  return true;
}

// Help Center Article creation functions
async function getExistingCategories() {
  try {
    const response = await axios.get(`${helpCenterBaseUrl}/categories.json`, {
      auth,
    });
    return response.data.categories || [];
  } catch (error) {
    console.error(
      chalk.red('✖ Error fetching categories:'),
      error.response?.data || error.message
    );
    return [];
  }
}

async function getExistingSections() {
  try {
    const response = await axios.get(`${helpCenterBaseUrl}/sections.json`, {
      auth,
    });
    return response.data.sections || [];
  } catch (error) {
    console.error(
      chalk.red('✖ Error fetching sections:'),
      error.response?.data || error.message
    );
    return [];
  }
}

async function createSection(sectionName, categoryId) {
  try {
    const payload = {
      section: {
        name: sectionName,
        locale: 'en-us',
      },
    };
    const response = await axios.post(
      `${helpCenterBaseUrl}/categories/${categoryId}/sections.json`,
      payload,
      { auth }
    );
    console.log(
      chalk.green(
        `✔ Created section: ${sectionName} (ID: ${response.data.section.id}) in category ${categoryId}`
      )
    );
    return response.data.section;
  } catch (error) {
    console.error(
      chalk.red(`✖ Error creating section '${sectionName}':`),
      error.response?.data || error.message
    );
    return null;
  }
}

async function createArticle(articleData, sectionId) {
  try {
    const payload = {
      article: {
        title: articleData.title,
        body: articleData.body,
        locale: 'en-us',
        section_id: sectionId,
        permission_group_id: 43279601811603,
        user_segment_id: null,
      },
      notify_subscribers: false,
    };

    const response = await axios.post(
      `${helpCenterBaseUrl}/sections/${sectionId}/articles.json`,
      payload,
      { auth }
    );
    console.log(
      chalk.green(
        `✔ Created article: ${articleData.title} (ID: ${response.data.article.id})`
      )
    );
    return response.data.article;
  } catch (error) {
    console.error(
      chalk.red(`✖ Error creating article '${articleData.title}':`),
      error.response?.data || error.message
    );
    return null;
  }
}

async function generateArticleContent(context, articlePrompts, categories) {
  console.log(chalk.cyan('Step 3: Generating article content with OpenAI...'));

  const categoryList = categories.map((c) => c.name).join(', ');
  const systemPrompt = `You are an expert content writer for help center articles. Given business context and article prompts, generate comprehensive, helpful articles. For each article, provide:
1. A clear, descriptive title
2. Well-structured HTML content with proper formatting
3. A suggested section name where this article should be placed
4. A suggested category name (from this list: ${categoryList}) where the section should be placed

Return a JSON array where each object has: title, body (HTML), suggested_section, and suggested_category. Only return valid JSON, no other text. Do not include the word "json" at the beginning or end of your response. Do not include \` or any other special characters in your response. Make sure to supply the permission_group_id for the article. It is always 43279601811603`;

  const promptData = [
    ['system', systemPrompt],
    ['human', `Business Context: ${context}`],
    ['human', `Article Prompts: ${articlePrompts.join('\n')}`],
  ];

  const prompt = ChatPromptTemplate.fromMessages(promptData);
  const openai = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3,
    modelName: 'gpt-4o',
  });

  try {
    const chain = prompt.pipe(openai);
    const response = await chain.invoke({});
    console.log(JSON.stringify(response, null, 2));
    const articles = JSON.parse(response.content);
    console.log(chalk.green(`✔ Generated ${articles.length} articles.`));
    return articles;
  } catch (error) {
    console.error(chalk.red('✖ Error generating articles:'), error.message);
    process.exit(1);
  }
}

async function createHelpCenterArticles() {
  console.log(chalk.cyan('=== Help Center Article Creation ===\n'));

  // Step 1: Get business context
  console.log(chalk.cyan('Step 1: Getting business context...'));
  const { context } = await inquirer.prompt([
    {
      type: 'input',
      name: 'context',
      message: chalk.yellow(
        'Enter business context (business name, needs, etc.):'
      ),
      validate: (input) => input.trim().length > 0 || 'Please enter context.',
    },
  ]);
  console.log(chalk.green('✔ Context received.'));

  // Step 2: Get article prompts
  console.log(chalk.cyan('Step 2: Getting article prompts...'));
  const { articlePromptsText } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'articlePromptsText',
      message: chalk.yellow(
        'Enter bulleted article prompts (one per line, starting with - or *):'
      ),
      validate: (input) =>
        input.trim().length > 0 || 'Please enter article prompts.',
    },
  ]);

  // Parse bulleted list
  const articlePrompts = articlePromptsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && (line.startsWith('-') || line.startsWith('*')))
    .map((line) => line.substring(1).trim());

  if (articlePrompts.length === 0) {
    console.error(chalk.red('✖ No valid article prompts found.'));
    process.exit(1);
  }
  console.log(chalk.green(`✔ Found ${articlePrompts.length} article prompts.`));

  // Step 3: Fetch categories
  console.log(chalk.cyan('Step 3: Fetching existing categories...'));
  const categories = await getExistingCategories();
  if (categories.length === 0) {
    console.error(
      chalk.red(
        '✖ No categories found in your Help Center. Please create at least one category first.'
      )
    );
    process.exit(1);
  }
  console.log(chalk.green(`✔ Found ${categories.length} categories.`));

  // Step 4: Generate article content
  const articles = await generateArticleContent(
    context,
    articlePrompts,
    categories
  );

  // Step 5: Get existing sections
  console.log(chalk.cyan('Step 5: Fetching existing sections...'));
  const existingSections = await getExistingSections();
  console.log(
    chalk.green(`✔ Found ${existingSections.length} existing sections.`)
  );

  // Step 6: Process each article
  const processedArticles = [];
  for (const article of articles) {
    console.log(chalk.cyan(`\nProcessing article: ${article.title}`));
    // Find or create section
    let section = existingSections.find(
      (s) => s.name.toLowerCase() === article.suggested_section.toLowerCase()
    );
    let category = null;
    if (section) {
      category = categories.find((c) => c.id === section.category_id);
      if (!category) {
        // fallback: just pick the first category
        category = categories[0];
      }
      console.log(
        chalk.green(
          `✔ Using existing section: ${section.name} (Category: ${category.name})`
        )
      );
    } else {
      // Find category by OpenAI suggestion
      if (article.suggested_category) {
        category = categories.find(
          (c) =>
            c.name.toLowerCase() === article.suggested_category.toLowerCase()
        );
      }
      if (!category) {
        // Prompt user to select category
        const { chosenCategoryId } = await inquirer.prompt([
          {
            type: 'list',
            name: 'chosenCategoryId',
            message: chalk.yellow(
              `Select a category for new section '${article.suggested_section}':`
            ),
            choices: categories.map((c) => ({ name: c.name, value: c.id })),
            default: categories[0].id,
          },
        ]);
        category = categories.find((c) => c.id === chosenCategoryId);
      }
      // Create section in the chosen category
      section = await createSection(article.suggested_section, category.id);
      if (section) {
        existingSections.push(section);
        console.log(
          chalk.green(
            `✔ Created new section: ${section.name} (Category: ${category.name})`
          )
        );
      } else {
        console.error(
          chalk.red(
            `✖ Failed to create section '${article.suggested_section}', skipping article.`
          )
        );
        continue;
      }
    }
    processedArticles.push({
      ...article,
      section: section,
      category: category,
    });
  }

  // Step 7: Review and approve articles
  console.log(chalk.cyan('\nStep 7: Review articles...'));
  const approvedArticles = [];

  for (const article of processedArticles) {
    console.log(chalk.cyan(`\n--- Article: ${article.title} ---`));
    console.log(chalk.yellow(`Section: ${article.section.name}`));
    console.log(chalk.yellow(`Category: ${article.category.name}`));
    console.log(chalk.white('Content:'));
    console.log(article.body);
    console.log(chalk.cyan('---'));

    const { approve } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'approve',
        message: chalk.yellow(`Approve this article?`),
        default: false,
      },
    ]);

    if (approve) {
      approvedArticles.push(article);
      console.log(chalk.green('✔ Article approved.'));
    } else {
      console.log(chalk.red('✖ Article rejected.'));
    }
  }

  if (approvedArticles.length === 0) {
    console.log(chalk.red('✖ No articles were approved. Exiting.'));
    return false;
  }

  // Step 8: Create articles
  console.log(
    chalk.cyan(`\nStep 8: Creating ${approvedArticles.length} articles...`)
  );
  let createdCount = 0;

  for (const article of approvedArticles) {
    const createdArticle = await createArticle(article, article.section.id);
    if (createdArticle) {
      createdCount++;
    }
  }

  console.log(
    chalk.green(
      `\n✔ Successfully created ${createdCount} out of ${approvedArticles.length} articles.`
    )
  );
  return createdCount > 0;
}

async function main() {
  // Initial choice between config changes and help center articles
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.cyan('What would you like to do?'),
      choices: [
        { name: 'Manage Macros, Views, and Custom Objects', value: 'config' },
        { name: 'Create Help Center Articles', value: 'articles' },
      ],
    },
  ]);

  if (action === 'articles') {
    const success = await createHelpCenterArticles();
    if (success) {
      console.log(
        chalk.green('\n✔ Help Center article creation completed successfully.')
      );
    } else {
      console.log(
        chalk.red('\n✖ Help Center article creation failed or was cancelled.')
      );
    }
    process.exit(success ? 0 : 1);
  }

  // Original config flow
  let keepGoing = true;
  let madeChange = false;
  while (keepGoing) {
    const didChange = await proposeAndApplyConfigChange();
    if (didChange) madeChange = true;
    const { another } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'another',
        message: chalk.yellow('Do you want to submit another config change?'),
        default: false,
      },
    ]);
    keepGoing = another;
  }
  if (!madeChange) {
    console.log(chalk.red('✖ No changes were made. Exiting.'));
    process.exit(0);
  }
  // 8. Run automation script
  console.log(
    chalk.cyan(
      'Step 8: Running zendesk-demo-automation.js to upload changes...'
    )
  );
  const child = spawn('node', [AUTOMATION_SCRIPT], { stdio: 'inherit' });
  child.on('exit', (code) => {
    if (code === 0) {
      console.log(chalk.green('✔ Zendesk automation completed successfully.'));
    } else {
      console.error(
        chalk.red('✖ Zendesk automation failed with exit code'),
        code
      );
    }
    process.exit(code);
  });
}

main();
