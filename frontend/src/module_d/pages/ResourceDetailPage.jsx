import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResourceDetail } from '../api/discoverApi';
import { getComments, addComment, likeResource, unlikeResource } from '../api/commentApi';
import '../styles/discovery.css';

/**
 * Resource Detail Page — Module D
 * PBI 4.4: View Resource Details
 * PBI 4.5: Basic Commenting and Feedback
 */

function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [showEmptyCommentModal, setShowEmptyCommentModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resourceRes, commentsRes] = await Promise.all([
          getResourceDetail(id),
          getComments(id)
        ]);
        setResource(resourceRes.data.data);
        setComments(commentsRes.data.data);
        // In a real app, you'd check if the current user has liked this resource
        setIsLiked(false); 
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Network error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSendComment = async () => {
    if (!newComment.trim()) {
      setShowEmptyCommentModal(true);
      return;
    }
    if (newComment.length > 500) return;
    try {
      setIsSubmitting(true);
      const res = await addComment(id, newComment);
      setComments([res.data.data, ...comments]);
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      if (isLiked) {
        await unlikeResource(id);
        setResource({ ...resource, likeCount: (resource.likeCount || 0) - 1 });
        setIsLiked(false);
      } else {
        await likeResource(id);
        setResource({ ...resource, likeCount: (resource.likeCount || 0) + 1 });
        setIsLiked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading resource details...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  if (!resource) return <div style={{ padding: '20px' }}>Resource not found.</div>;

  const mediaFiles = resource.media || [];
  const currentMedia = mediaFiles[currentImageIndex];

  return (
    <div className="d-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <button 
        className="d-button d-button-secondary" 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: '20px' }}
      >
        &larr; Back
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Side: Media Viewer */}
        <div>
          <div 
            style={{ width: '100%', height: '400px', backgroundColor: '#eee', cursor: 'pointer', overflow: 'hidden', borderRadius: '8px' }}
            onClick={() => setIsImageModalOpen(true)}
          >
            {currentMedia ? (
              <img 
                src={currentMedia.fileUrl} 
                alt={currentMedia.fileName} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No Media</div>
            )}
          </div>
          
          {/* Thumbnail Strip */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto' }}>
            {mediaFiles.map((m, index) => (
              <img 
                key={m.id} 
                src={m.fileUrl} 
                alt={m.fileName}
                onClick={() => setCurrentImageIndex(index)}
                style={{ 
                  width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer',
                  border: index === currentImageIndex ? '2px solid #007bff' : '2px solid transparent',
                  borderRadius: '4px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Details */}
        <div>
          <h1 style={{ marginTop: 0 }}>{resource.title || 'Not provided'}</h1>
          <p style={{ color: '#666' }}>
            <strong>Category:</strong> {resource.categoryName || 'Not provided'} | 
            <strong> Place:</strong> {resource.place || 'Not provided'}
          </p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{resource.description || 'Not provided'}</p>
          
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
            <p><strong>Contributor:</strong> {resource.contributor?.username || 'Not provided'}</p>
            <p><strong>Copyright:</strong> {resource.copyrightDeclaration || 'Not provided'}</p>
            {resource.externalLink ? (
              <p>
                <strong>Link: </strong> 
                <a href={resource.externalLink} target="_blank" rel="noopener noreferrer">
                  View Source &nearrow;
                </a>
              </p>
            ) : (
              <p><strong>Link:</strong> Not provided</p>
            )}
            <p><strong>Status:</strong> <span style={{ 
              padding: '2px 8px', borderRadius: '4px', fontSize: '0.8em',
              backgroundColor: resource.status === 'APPROVED' ? '#d4edda' : '#f8d7da',
              color: resource.status === 'APPROVED' ? '#155724' : '#721c24'
            }}>{resource.status}</span></p>
          </div>

          {/* Archived notice banner */}
          {resource.status === 'ARCHIVED' && (
            <div style={{
              marginTop: '20px',
              padding: '10px 15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              color: '#856404',
              fontSize: '0.9em'
            }}>
              📦 This resource has been archived. Likes and comments are disabled.
            </div>
          )}

          <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Like button: disabled + greyed out when ARCHIVED */}
            <div
              onClick={resource.status !== 'ARCHIVED' ? handleToggleLike : undefined}
              title={resource.status === 'ARCHIVED' ? 'Liking is disabled for archived resources' : ''}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                padding: '8px 15px',
                borderRadius: '20px',
                border: '1px solid #eee',
                backgroundColor: resource.status === 'ARCHIVED'
                  ? '#f5f5f5'
                  : isLiked ? '#fff0f0' : '#fff',
                cursor: resource.status === 'ARCHIVED' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: resource.status === 'ARCHIVED' ? 0.5 : 1,
                userSelect: 'none'
              }}
            >
              <span style={{ fontSize: '1.2em' }}>
                {isLiked && resource.status !== 'ARCHIVED' ? '❤️' : '🤍'}
              </span>
              <span style={{ color: isLiked && resource.status !== 'ARCHIVED' ? '#ff4d4f' : '#666' }}>
                {resource.likeCount ?? 0}
              </span>
            </div>
            <span style={{ color: '#666' }}>💬 {resource.commentCount ?? 0} Comments</span>
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
        <h3>Comments</h3>

        {/* Only show input area if NOT archived */}
        {resource.status !== 'ARCHIVED' ? (
          <div style={{ marginBottom: '30px' }}>
            <textarea 
              placeholder="Write a comment (max 500 chars)..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8em', color: newComment.length > 500 ? 'red' : '#666' }}>
                {newComment.length}/500
              </span>
              <button 
                className="d-button"
                onClick={handleSendComment} 
                disabled={isSubmitting || newComment.length > 500}
                style={{ padding: '8px 20px' }}
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            marginBottom: '25px',
            padding: '12px 15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            color: '#999',
            fontSize: '0.9em'
          }}>
            💬 Comments are disabled for archived resources. Existing comments are shown below for reference.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {comments.length > 0 ? comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', gap: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ddd', flexShrink: 0 }}></div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                  {comment.user?.username || 'Anonymous'} <span style={{ fontWeight: 'normal', color: '#999', marginLeft: '10px' }}>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ marginTop: '5px' }}>{comment.content}</p>
              </div>
            </div>
          )) : (
            <p style={{ color: '#999' }}>No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>

      {/* Image Modal (Simple) */}
      {isImageModalOpen && currentMedia && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
          }}
          onClick={() => setIsImageModalOpen(false)}
        >
          <img 
            src={currentMedia.fileUrl} 
            alt="Full Size" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
          />
          <div style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', fontSize: '2em', cursor: 'pointer' }}>&times;</div>
        </div>
      )}

      {/* Empty Comment Modal */}
      {showEmptyCommentModal && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 2000,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ marginTop: 0, color: '#333' }}>Validation Error</h3>
            <p style={{ color: '#666', marginBottom: '25px' }}>Comment cannot be empty. Please enter some text before sending.</p>
            <button 
              className="d-button"
              onClick={() => setShowEmptyCommentModal(false)}
              style={{ padding: '10px 40px' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceDetailPage;
