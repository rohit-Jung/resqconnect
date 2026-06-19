import { Ionicons } from '@expo/vector-icons';

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../constants';
import { feedbackCardStyles as styles } from '../stylesheet';

interface FeedbackCardProps {
  providerName: string;
  emergencyType: string;
  onSubmit: (data: {
    message: string;
    serviceRatings: number;
  }) => Promise<void>;
  onSkip: () => void;
}

const RATINGS = [1, 2, 3, 4, 5];

export function FeedbackCard({
  providerName,
  emergencyType,
  onSubmit,
  onSkip,
}: FeedbackCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ message, serviceRatings: rating });
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.submittedBody}>
          <Ionicons name="checkmark-circle" size={48} color={COLORS.GREEN} />
          <Text style={styles.submittedTitle}>THANK YOU</Text>
          <Text style={styles.submittedSubtext}>
            Your feedback helps us improve our emergency response service.
          </Text>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View
          style={[styles.typeBadge, { backgroundColor: COLORS.SIGNAL_RED }]}
        >
          <Ionicons name="medical" size={12} color="#fff" />
          <Text style={styles.typeBadgeText}>
            {emergencyType.toUpperCase()} EMERGENCY
          </Text>
        </View>
      </View>

      <Text style={styles.title}>RATE YOUR EXPERIENCE</Text>
      <Text style={styles.providerText}>Responder: {providerName}</Text>

      {/* Star rating */}
      <View style={styles.starsRow}>
        {RATINGS.map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={36}
              color={star <= rating ? COLORS.AMBER : COLORS.LIGHT_GRAY}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.ratingLabel}>
          {rating === 1
            ? 'POOR'
            : rating === 2
              ? 'FAIR'
              : rating === 3
                ? 'GOOD'
                : rating === 4
                  ? 'VERY GOOD'
                  : 'EXCELLENT'}
        </Text>
      )}

      {/* Message input */}
      <TextInput
        style={styles.input}
        placeholder="Share your experience (optional)..."
        placeholderTextColor={COLORS.MID_GRAY}
        multiline
        value={message}
        onChangeText={setMessage}
        maxLength={500}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          disabled={submitting}
        >
          <Text style={styles.skipButtonText}>SKIP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>SUBMIT</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
