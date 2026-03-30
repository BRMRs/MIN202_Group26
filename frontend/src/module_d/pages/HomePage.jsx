import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_RESOURCES } from '../api/mockData';

/**
 * Home Page — Module D
 * Summary D-PBI 1: Browse Approved Resources
 */
function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5em', color: '#333' }}>Heritage Platform</h1>
        <p style={{ fontSize: '1.2em', color: '#666' }}>Browse community heritage resources</p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '30px' 
      }}>
        {MOCK_RESOURCES.map(resource => (
          <div 
            key={resource.id}
            onClick={() => navigate(`/resources/${resource.id}`)}
            style={{ 
              border: '1px solid #eee', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              backgroundColor: '#fff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ width: '100%', height: '200px', backgroundColor: '#f0f0f0' }}>
              <img 
                src={resource.media?.[0]?.file_url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                alt={resource.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{resource.title}</h3>
              <p style={{ 
                color: '#666', 
                fontSize: '0.9em', 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden',
                height: '2.8em',
                marginBottom: '15px'
              }}>
                {resource.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '0.8em', 
                  backgroundColor: '#f0f0f0', 
                  padding: '4px 10px', 
                  borderRadius: '20px',
                  color: '#555'
                }}>
                  {resource.category?.name || 'Uncategorized'}
                </span>
                <span style={{ fontSize: '0.8em', color: '#999' }}>
                  ❤️ {resource.like_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
