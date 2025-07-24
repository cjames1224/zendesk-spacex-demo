import React, { useState, useEffect } from 'react';

const PRODUCTS = [
  {
    key: 'falcon9',
    name: 'Falcon 9',
    image:
      'https://www.spacex.com/static/images/falcon-9/desktop/Block5_Render_Desktop.png',
    description:
      'Falcon 9 is a reusable, two-stage rocket designed and manufactured by SpaceX for the reliable and safe transport of people and payloads into Earth orbit and beyond.',
  },
  {
    key: 'falconheavy',
    name: 'Falcon Heavy',
    image:
      'https://www.spacex.com/static/images/falcon-heavy/desktop/FH_Render_Desktop.png',
    description:
      'Falcon Heavy is the most powerful operational rocket in the world by a factor of two, with the ability to lift into orbit nearly 64 metric tons.',
  },
  {
    key: 'starship',
    name: 'Starship',
    image:
      'https://www.spacex.com/static/images/starship/desktop/Starship_Render_Desktop.png',
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

function ProductDetails({ product }) {
  if (!product) return null;
  return (
    <div
      style={{
        marginTop: 32,
        padding: 24,
        borderRadius: 12,
        background: '#f5f7fa',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '100%',
        maxWidth: '800px',
      }}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{ width: 220, marginBottom: 16, borderRadius: 8 }}
      />
      <h2 style={{ margin: '8px 0 12px 0', color: '#222', fontWeight: 700 }}>
        {product.name}
      </h2>
      <p style={{ color: '#333', fontSize: 18 }}>{product.description}</p>
    </div>
  );
}

export default function App() {
  const [selectedKey, setSelectedKey] = useState('');
  const [clerk, setClerk] = useState(null);
  const selectedProduct = PRODUCTS.find((p) => p.key === selectedKey);

  useEffect(() => {
    // Fetch Clerk publishable key from API
    fetch('/api/clerk-key')
      .then((response) => response.json())
      .then((data) => {
        if (window.Clerk && data.publishableKey) {
          const clerkInstance = window.Clerk.init({
            publishableKey: data.publishableKey,
          });
          setClerk(clerkInstance);
        }
      })
      .catch((error) => {
        console.error('Error fetching Clerk key:', error);
      });
  }, []);

  useEffect(() => {
    if (clerk) {
      // Mount the sign-in component
      clerk.mountSignIn('#clerk-sign-in');
    }
  }, [clerk]);

  return (
    <div style={{ background: '#fff', minHeight: '100vh', width: '100%' }}>
      {/* Top Navigation */}
      <nav
        style={{
          width: '100%',
          background: '#f5f7fa',
          borderBottom: '1px solid #e0e6ed',
          padding: '0 0 0 0',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          height: 64,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            marginLeft: 32,
          }}
        >
          <img
            src="https://www.spacex.com/static/images/share.jpg"
            alt="SpaceX Logo"
            style={{ height: 40, borderRadius: 8, marginRight: 18 }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: '#222',
              letterSpacing: 2,
            }}
          >
            SpaceX Demo
          </span>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            marginRight: 32,
            display: 'flex',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <a
            href="#"
            style={{
              color: '#222',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 17,
            }}
          >
            Home
          </a>
          <a
            href="#"
            style={{
              color: '#222',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 17,
            }}
          >
            Products
          </a>
          <a
            href="#"
            style={{
              color: '#222',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 17,
            }}
          >
            About
          </a>
          <div id="clerk-sign-in"></div>
        </div>
      </nav>

      {/* Main Content */}
      <div
        style={{
          textAlign: 'center',
          padding: '32px 20px 0 20px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ fontWeight: 700, fontSize: 40, margin: 0, color: '#222' }}>
          Welcome to SpaceX Demo
        </h1>
        <p style={{ fontSize: 20, color: '#444', margin: '24px 0' }}>
          Experience the future of space technology.
          <br />
          Select a product to learn more.
        </p>
        <div style={{ margin: '32px 0' }}>
          <label
            htmlFor="product-select"
            style={{ fontSize: 18, color: '#222', fontWeight: 500 }}
          >
            Choose a SpaceX Product:
          </label>
          <select
            id="product-select"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            style={{
              marginLeft: 16,
              fontSize: 18,
              padding: '8px 18px',
              borderRadius: 6,
              border: '1px solid #c0c6cf',
              background: '#f5f7fa',
              color: '#222',
            }}
          >
            <option value="">-- Select --</option>
            {PRODUCTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <ProductDetails product={selectedProduct} />
      </div>
    </div>
  );
}
