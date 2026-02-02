import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import { storage } from '../../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ReceiptUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  codeRequestId,
  isLoading,
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setUploadSuccess(false);
      setUploadedUrl(null);
      setPreviewUrl(null);
      setUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    console.log('Upload attempt - selectedFile:', selectedFile, 'codeRequestId:', codeRequestId);
    
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }
    
    if (!codeRequestId) {
      alert('Code request ID is missing. Please try again.');
      return;
    }

    setUploading(true);
    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const filename = `${codeRequestId}_${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, `receipts/${filename}`);
      
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      // Show success state
      setUploadedUrl(downloadUrl);
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      alert('Error uploading receipt: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRequestCode = () => {
    // Call the callback with the uploaded URL
    onUploadSuccess(uploadedUrl);
    setUploadSuccess(false);
    setPreviewUrl(null);
    setUploadedUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: '56px', sm: '64px' },
        left: 0,
        right: 0,
        bottom: { xs: '56px', sm: '56px' },
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: { xs: '8px', sm: '16px', md: '20px' },
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: '90vw', sm: '420px', md: '500px' },
          maxHeight: { xs: '80vh', sm: '85vh' },
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          color: '#ffffff',
          border: 'none',
          borderLeft: '4px solid #d4af37',
          borderRadius: 0,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(212, 175, 55, 0.1)',
          animation: 'slideUp 0.35s ease-out',
          display: 'flex',
          flexDirection: 'column',
          '@keyframes slideUp': {
            from: { opacity: 0, transform: 'translateY(30px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent
          sx={{
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            '&:last-child': { paddingBottom: 0 },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: { xs: '12px 14px', sm: '16px 18px' },
              paddingBottom: { xs: '10px', sm: '12px' },
              borderBottom: '1px solid #2a2a2a',
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#d4af37',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  fontFamily: "'Cinzel', serif",
                  margin: 0,
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
                }}
              >
                Upload Payment Receipt
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#999999',
                  mt: '4px',
                  letterSpacing: '0.3px',
                }}
              >
                Provide proof of payment
              </Typography>
            </Box>
            <Button
              onClick={onClose}
              disabled={uploading || isLoading}
              sx={{
                color: '#999999',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '2px 4px',
                minWidth: 'auto',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#d4af37',
                  transform: 'scale(1.2) rotate(90deg)',
                },
                '&:disabled': {
                  color: '#2a2a2a',
                  cursor: 'not-allowed',
                },
              }}
            >
              ✕
            </Button>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              padding: { xs: '12px 14px', sm: '14px 16px' },
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {uploadSuccess ? (
              <>
                <Box
                  sx={{
                    background: 'rgba(74, 222, 128, 0.1)',
                    border: '2px solid rgba(74, 222, 128, 0.3)',
                    padding: '20px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '2.5rem',
                      color: '#4ade80',
                    }}
                  >
                    ✓
                  </Typography>
                  <Typography
                    sx={{
                      color: '#4ade80',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}
                  >
                    Receipt Uploaded Successfully!
                  </Typography>
                </Box>

                <Box
                  sx={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '12px',
                    borderRadius: '4px',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#999999',
                      fontSize: '0.75rem',
                      lineHeight: 1.6,
                    }}
                  >
                    Your receipt has been uploaded successfully. Click "Request Code" below to send your request to the admin for code generation.
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <Typography
                  sx={{
                    color: '#999999',
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    textAlign: 'center',
                    lineHeight: 1.5,
                    letterSpacing: '0.2px',
                  }}
                >
                  Upload a clear image or PDF of your payment receipt from the payment center.
                </Typography>

                {/* File Input Area */}
                <Box
                  sx={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '2px dashed rgba(212, 175, 55, 0.4)',
                    padding: { xs: '16px', sm: '20px' },
                    borderRadius: '4px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(212, 175, 55, 0.15)',
                      borderColor: 'rgba(212, 175, 55, 0.6)',
                      boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)',
                    },
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <Typography
                    sx={{
                      color: '#d4af37',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                    }}
                  >
                    📎 Click to select file
                  </Typography>
                  <Typography
                    sx={{
                      color: '#999999',
                      fontSize: '0.7rem',
                    }}
                  >
                    PNG, JPG, PDF (max 5MB)
                  </Typography>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </Box>

                {/* Selected File Display */}
                {selectedFile && (
                  <Box
                    sx={{
                      background: 'rgba(74, 222, 128, 0.08)',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      padding: '10px 12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#4ade80',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      ✓ Selected: {selectedFile.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#999999',
                        fontSize: '0.7rem',
                      }}
                    >
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                )}

                {/* Image Preview */}
                {previewUrl && (
                  <Box
                    sx={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '4px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                      }}
                    />
                  </Box>
                )}

                <Divider sx={{ borderColor: '#2a2a2a !important', my: '4px' }} />

                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: '#d4af37',
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Required Information:</strong>
                  <br />
                  • Clear receipt image or PDF
                  <br />
                  • Shows payment amount
                  <br />
                  • Shows payment date and time
                  <br />
                  • Shows receipt/reference number
                </Typography>
              </>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ flexShrink: 0 }}>
            <Divider sx={{ borderColor: '#2a2a2a !important', margin: { xs: '8px 0', sm: '10px 0' } }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: { xs: '10px 12px', sm: '12px 14px' },
              }}
            >
              <Button
                onClick={onClose}
                disabled={uploading || isLoading || uploadSuccess}
                variant="outlined"
                sx={{
                  color: '#999999',
                  borderColor: 'transparent',
                  background: 'transparent',
                  padding: '8px 10px',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    color: '#d4af37',
                    borderColor: 'transparent',
                  },
                  '&:disabled': {
                    color: '#555555',
                    borderColor: 'transparent',
                    cursor: 'not-allowed',
                  },
                }}
              >
                {uploadSuccess ? 'Keep Open' : 'Cancel'}
              </Button>
              <Button
                onClick={uploadSuccess ? handleRequestCode : handleUpload}
                disabled={uploadSuccess ? false : !selectedFile || uploading || isLoading}
                variant="contained"
                sx={{
                  background: uploadSuccess 
                    ? 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)'
                    : uploading ? 'linear-gradient(135deg, #4a4a4a, #6a6a6a, #4a4a4a)' : 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                  color: uploadSuccess ? '#000000' : '#000000',
                  padding: '8px 10px',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  border: uploadSuccess ? '1px solid #d4af37' : '1px solid #d4af37',
                  boxShadow: uploadSuccess ? '0 2px 8px rgba(212, 175, 55, 0.3)' : '0 2px 8px rgba(212, 175, 55, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  '&:hover': {
                    boxShadow: uploadSuccess ? '0 4px 12px rgba(212, 175, 55, 0.5)' : '0 4px 12px rgba(212, 175, 55, 0.5)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #4a4a4a, #6a6a6a, #4a4a4a)',
                    color: '#999999',
                    boxShadow: 'none',
                    cursor: 'not-allowed',
                  },
                }}
              >
                {uploadSuccess ? (
                  'Request Code'
                ) : uploading ? (
                  <>
                    <CircularProgress size={16} sx={{ color: '#d4af37' }} />
                    Uploading...
                  </>
                ) : (
                  'Upload Receipt'
                )}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return createPortal(modalContent, document.body);
}
