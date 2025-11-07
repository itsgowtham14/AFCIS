import React from 'react';
import { Box } from '@mui/material';

export default function RatingStars({ value = 0 }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <Box sx={{ color: '#ffb400' }}>
      {stars.map((s) => (
        <span key={s}>{s <= Math.round(value) ? '★' : '☆'}</span>
      ))}
    </Box>
  );
}
