import React, { useState, useEffect } from 'react';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';
import { Button } from './components/Button';
import { Tabs } from './components/Tabs';
import { Card } from './components/Card';

const PRODUCTS = [
  {
    key: 'falcon9',
    name: 'Falcon 9',
    image:
      'https://airandspace.si.edu/sites/default/files/images/collection-objects/ksc-20200521-ph-kls030044large.jpg',
    description:
      'Falcon 9 is a reusable, two-stage rocket designed and manufactured by SpaceX for the reliable and safe transport of people and payloads into Earth orbit and beyond.',
  },
  {
    key: 'falconheavy',
    name: 'Falcon Heavy',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/4/4b/Falcon_Heavy_Demo_Mission_%2840078828431%29.jpg',
    description:
      'Falcon Heavy is the most powerful operational rocket in the world by a factor of two, with the ability to lift into orbit nearly 64 metric tons.',
  },
  {
    key: 'starship',
    name: 'Starship',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/6/6e/Starship_SN9_on_pad.jpg',
    description:
      'Starship is a fully reusable transportation system designed to carry both crew and cargo to Earth orbit, the Moon, Mars, and beyond.',
  },
  {
    key: 'dragon',
    name: 'Dragon',
    image:
      'https://www.spacex.com/static/images/dragon/desktop/Dragon_Render_Desktop.png',
    description:
      'Dragon is a free-flying spacecraft designed to deliver both cargo and people to orbiting destinations.',
  },
];

function ProductSection({ product }) {
  if (!product) return null;
  return (
    <Card
      style={{
        marginTop: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 600,
        marginLeft: 'auto',
        marginRight: 'auto',
        background: '#fff',
      }}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{
          width: 220,
          marginBottom: 24,
          borderRadius: 8,
          background: '#f3f3f3',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      />
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#222',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {product.name}
      </h2>
      <p style={{ color: '#444', fontSize: 18, textAlign: 'center' }}>
        {product.description}
      </p>
    </Card>
  );
}

export default function App() {
  const [selectedKey, setSelectedKey] = useState(PRODUCTS[0].key);
  const [publishableKey, setPublishableKey] = useState(null);
  const selectedProduct = PRODUCTS.find((p) => p.key === selectedKey);

  useEffect(() => {
    fetch('/api/clerk-key')
      .then((response) => response.json())
      .then((data) => setPublishableKey(data.publishableKey))
      .catch((error) => {
        console.error('Error fetching Clerk key:', error);
      });
  }, []);

  if (!publishableKey) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#222',
          fontSize: 22,
        }}
      >
        Loading authentication...
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <div style={{ minHeight: '100vh', background: '#f3f3f3', color: '#222' }}>
        {/* Header with product tabs and Clerk login */}
        <header
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 48px',
            borderBottom: '1px solid #e0e0e0',
            background: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src="https://www.spacex.com/static/images/share.jpg"
              alt="SpaceX Logo"
              style={{
                height: 40,
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: 2,
                color: '#222',
                textTransform: 'uppercase',
              }}
            >
              SpaceX
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Tabs
              tabs={PRODUCTS}
              value={selectedKey}
              onChange={setSelectedKey}
            />
            <div style={{ marginLeft: 24 }}>
              <SignedOut>
                <SignInButton>
                  <Button variant="outline">Sign In</Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </header>

        {/* Landing page section */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 16px 0 16px',
          }}
        >
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              textAlign: 'center',
              marginTop: 32,
              marginBottom: 16,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#222',
            }}
          >
            Welcome to the SpaceX Product Demo
          </h1>
          <p
            style={{
              color: '#555',
              fontSize: 20,
              marginBottom: 32,
              textAlign: 'center',
              maxWidth: 600,
            }}
          >
            Explore SpaceX's family of rockets and spacecraft. Select a product
            above to learn more about its features and capabilities.
          </p>
        </section>

        {/* Selected product section */}
        <section>
          <ProductSection product={selectedProduct} />
        </section>
      </div>
    </ClerkProvider>
  );
}
