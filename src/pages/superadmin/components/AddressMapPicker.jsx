import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

export default function AddressMapPicker({ address, onAddressChange }) {
  const [openMap, setOpenMap] = useState(false);
  const [searchInput, setSearchInput] = useState(address);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [selectedAddress, setSelectedAddress] = useState(address);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const handleOpenMap = () => {
    setSearchInput(address);
    setSelectedAddress(address);
    setOpenMap(true);
  };

  const handleCloseMap = () => {
    setOpenMap(false);
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPosition({ lat, lng });
        setSelectedAddress(place.formatted_address);
        setSearchInput(place.formatted_address);

        // Center map on new location
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }
      }
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });

    // Use Google's Geocoding API to get address from coordinates
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setSelectedAddress(results[0].formatted_address);
        setSearchInput(results[0].formatted_address);
      }
    });
  };

  const handleConfirm = () => {
    onAddressChange(selectedAddress);
    handleCloseMap();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
      <TextField
        fullWidth
        label="Address"
        name="address"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        variant="outlined"
        size="medium"
        placeholder="Type address or click map button..."
      />
      <Button
        variant="contained"
        startIcon={<LocationOnIcon />}
        onClick={handleOpenMap}
        sx={{
          backgroundColor: '#d4af37',
          color: '#081014',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#c9a227',
          },
          minWidth: '120px',
        }}
      >
        Map
      </Button>

      {/* Map Dialog */}
      <Dialog open={openMap} onClose={handleCloseMap} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#081014', color: '#d4af37', fontWeight: 600 }}>
          📍 Select Address from Map
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
            {/* Search Box */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Search Location:
              </Typography>
              <Autocomplete
                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                onPlaceChanged={handlePlaceSelect}
              >
                <TextField
                  fullWidth
                  placeholder="Search address, city, or place..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Autocomplete>
            </Box>

            {/* Map */}
            <GoogleMap
              onLoad={(map) => (mapRef.current = map)}
              mapContainerStyle={mapContainerStyle}
              center={markerPosition}
              zoom={13}
              onClick={handleMapClick}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
              }}
            >
              <Marker position={markerPosition} />
            </GoogleMap>

            {/* Selected Address */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Selected Address:
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', wordBreak: 'break-word' }}>
                {selectedAddress || 'No address selected'}
              </Typography>
            </Box>
          </LoadScript>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseMap} variant="outlined" sx={{ color: '#d4af37', borderColor: '#d4af37' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="contained" sx={{ backgroundColor: '#d4af37', color: '#081014', fontWeight: 600 }}>
            Confirm Address
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
