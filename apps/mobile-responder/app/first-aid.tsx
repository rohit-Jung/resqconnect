import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { EMERGENCY_PHONE_NUMBER } from '@/constants';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

interface FirstAidGuide {
  id: string;
  title: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  color: string;
  warning?: string;
  steps: string[];
  doNot?: string[];
}

const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'cpr',
    title: 'CPR (Cardiopulmonary Resuscitation)',
    icon: 'heart-outline',
    iconType: 'ionicons',
    color: SIGNAL_RED,
    warning:
      'Only perform CPR if the person is unresponsive and not breathing normally.',
    steps: [
      'Call emergency services immediately or ask someone to call.',
      'Place the person on their back on a firm, flat surface.',
      'Kneel beside their chest and place the heel of one hand on the center of their chest.',
      'Place your other hand on top and interlock your fingers.',
      'Keep your arms straight and push hard and fast - at least 2 inches deep.',
      'Push at a rate of 100-120 compressions per minute.',
      'If trained, give 2 rescue breaths after every 30 compressions.',
      'Continue until help arrives or the person shows signs of life.',
    ],
    doNot: [
      'Do not stop CPR unless the person starts breathing or help arrives.',
      'Do not perform CPR if the person is breathing normally.',
    ],
  },
  {
    id: 'choking',
    title: 'Choking (Heimlich Maneuver)',
    icon: 'hand-left-outline',
    iconType: 'ionicons',
    color: '#F97316',
    warning: 'Use only if the person cannot cough, speak, or breathe.',
    steps: [
      'Stand behind the choking person.',
      'Wrap your arms around their waist.',
      'Make a fist with one hand and place it just above their belly button.',
      'Grasp your fist with your other hand.',
      'Give quick, upward thrusts into their abdomen.',
      'Repeat until the object is expelled or the person can breathe.',
      'If the person becomes unconscious, lower them to the ground and begin CPR.',
    ],
    doNot: [
      'Do not slap the person on the back while they are upright.',
      'Do not give abdominal thrusts to infants under 1 year old.',
    ],
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    icon: 'water-outline',
    iconType: 'ionicons',
    color: SIGNAL_RED,
    steps: [
      'Call emergency services if bleeding is severe.',
      'Apply direct pressure to the wound with a clean cloth or bandage.',
      'If blood soaks through, add more material on top - do not remove the first layer.',
      'Elevate the injured area above the heart if possible.',
      'Apply a pressure bandage firmly over the wound.',
      'For limb injuries, consider applying a tourniquet if bleeding cannot be controlled.',
      'Keep the person calm and lying down to prevent shock.',
      'Monitor for signs of shock: pale skin, rapid breathing, confusion.',
    ],
    doNot: [
      'Do not remove objects embedded in the wound.',
      'Do not apply a tourniquet unless absolutely necessary.',
    ],
  },
  {
    id: 'burns',
    title: 'Burns Treatment',
    icon: 'flame-outline',
    iconType: 'ionicons',
    color: '#F59E0B',
    steps: [
      'Remove the person from the source of the burn.',
      'Cool the burn under cool (not cold) running water for at least 10 minutes.',
      'Remove any jewelry or tight clothing near the burn before swelling starts.',
      'Cover the burn loosely with a clean, non-stick bandage.',
      'Take over-the-counter pain medication if needed.',
      'For severe burns (large area, face, hands, genitals), seek immediate medical help.',
      'Watch for signs of infection: increased pain, redness, swelling, or fever.',
    ],
    doNot: [
      'Do not apply ice, butter, or toothpaste to burns.',
      'Do not break blisters.',
      'Do not remove clothing stuck to the burn.',
    ],
  },
  {
    id: 'fractures',
    title: 'Fractures & Sprains',
    icon: 'body-outline',
    iconType: 'ionicons',
    color: '#8B5CF6',
    steps: [
      'Keep the injured area still and supported.',
      'Apply ice wrapped in a cloth to reduce swelling (20 minutes on, 20 minutes off).',
      'Elevate the injured limb if possible.',
      'Immobilize the area with a splint if available.',
      'Use padding around the injury for comfort.',
      'Seek medical attention for proper diagnosis and treatment.',
      'For open fractures (bone visible), cover with clean dressing and call emergency services.',
    ],
    doNot: [
      'Do not try to straighten a broken bone.',
      'Do not move the person if you suspect a spinal injury.',
      'Do not apply ice directly to the skin.',
    ],
  },
  {
    id: 'heart-attack',
    title: 'Heart Attack Signs',
    icon: 'fitness-outline',
    iconType: 'ionicons',
    color: SIGNAL_RED,
    warning:
      'Call emergency services immediately if you suspect a heart attack!',
    steps: [
      'Recognize the signs: chest pain/pressure, pain in arm/jaw/back, shortness of breath, cold sweat, nausea.',
      'Call emergency services immediately - do not wait.',
      'Have the person sit or lie down in a comfortable position.',
      'If prescribed, help them take their nitroglycerin.',
      'If available and not allergic, give them an aspirin to chew.',
      'Loosen any tight clothing.',
      'Stay with them and monitor their condition.',
      'Be prepared to perform CPR if they become unresponsive.',
    ],
  },
  {
    id: 'stroke',
    title: 'Stroke Signs (FAST)',
    icon: 'pulse-outline',
    iconType: 'ionicons',
    color: '#3B82F6',
    warning: 'Time is critical! Call emergency services immediately.',
    steps: [
      'F - FACE: Ask the person to smile. Does one side droop?',
      'A - ARMS: Ask them to raise both arms. Does one drift downward?',
      'S - SPEECH: Ask them to repeat a simple phrase. Is speech slurred?',
      'T - TIME: If you see any of these signs, call emergency services immediately.',
      'Note the time when symptoms first appeared - this is important for treatment.',
      'Keep the person comfortable and do not give them anything to eat or drink.',
      'If unconscious, place them in the recovery position.',
      'Monitor their breathing and be prepared to perform CPR.',
    ],
  },
  {
    id: 'allergic-reaction',
    title: 'Severe Allergic Reaction',
    icon: 'alert-circle-outline',
    iconType: 'ionicons',
    color: '#10B981',
    warning:
      'Anaphylaxis is life-threatening. Use EpiPen if available and call emergency services.',
    steps: [
      'Call emergency services immediately.',
      'If the person has an EpiPen, help them use it (inject into outer thigh).',
      'Have them lie down with legs elevated (unless having breathing difficulty).',
      'Loosen tight clothing.',
      'If they stop breathing, begin CPR.',
      'A second dose of epinephrine may be given after 5-15 minutes if no improvement.',
      'Stay with them until emergency help arrives.',
      'Note any known allergies to tell emergency responders.',
    ],
  },
  {
    id: 'poisoning',
    title: 'Poisoning',
    icon: 'skull-outline',
    iconType: 'ionicons',
    color: MID_GRAY,
    steps: [
      'Call Poison Control or emergency services immediately.',
      'Try to identify what was ingested and how much.',
      'Do not induce vomiting unless instructed by Poison Control.',
      'If the person is conscious, have them rinse their mouth with water.',
      'If poison is on skin, remove contaminated clothing and rinse skin.',
      'If poison is in eyes, rinse with clean water for 15-20 minutes.',
      'Bring the poison container to the hospital if possible.',
      'Monitor breathing and be prepared to perform CPR if needed.',
    ],
    doNot: [
      'Do not give anything by mouth unless instructed.',
      'Do not induce vomiting unless told to do so by professionals.',
    ],
  },
];

export default function FirstAidScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuides = FIRST_AID_GUIDES.filter(
    guide =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.steps.some(step =>
        step.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleEmergencyCall = () => {
    Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`);
  };

  const renderIcon = (guide: FirstAidGuide) => {
    if (guide.iconType === 'ionicons') {
      return (
        <Ionicons name={guide.icon as any} size={24} color={guide.color} />
      );
    }
    return (
      <MaterialCommunityIcons
        name={guide.icon as any}
        size={24}
        color={guide.color}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Swiss style */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>FIRST AID GUIDE</Text>
        </View>
        <TouchableOpacity
          onPress={handleEmergencyCall}
          style={styles.callButton}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={20} color={OFF_WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={MID_GRAY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search first aid guides..."
              placeholderTextColor={MID_GRAY}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={MID_GRAY} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>IMPORTANT NOTICE</Text>
            <Text style={styles.warningText}>
              These guides are for educational purposes only. Always call
              emergency services for serious medical emergencies. When in doubt,
              seek professional help.
            </Text>
          </View>
        </View>

        {/* First Aid Guides */}
        {filteredGuides.length > 0 ? (
          <View style={styles.guidesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>GUIDES</Text>
              <View style={styles.sectionLine} />
            </View>
            <Accordion>
              {filteredGuides.map(guide => (
                <AccordionItem
                  key={guide.id}
                  title={guide.title}
                  icon={guide.icon as any}
                  iconColor={guide.color}
                >
                  {guide.warning && (
                    <View style={styles.guideWarning}>
                      <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                      <Text style={styles.guideWarningText}>
                        {guide.warning}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.guideStepsTitle}>STEPS TO FOLLOW:</Text>
                  {guide.steps.map((step, index) => (
                    <View key={index} style={styles.guideStep}>
                      <View
                        style={[
                          styles.stepNumber,
                          { backgroundColor: `${guide.color}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepNumberText,
                            { color: guide.color },
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}

                  {guide.doNot && guide.doNot.length > 0 && (
                    <View style={styles.doNotSection}>
                      <Text style={styles.doNotTitle}>DO NOT:</Text>
                      {guide.doNot.map((item, index) => (
                        <View key={index} style={styles.doNotItem}>
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color={SIGNAL_RED}
                          />
                          <Text style={styles.doNotText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </AccordionItem>
              ))}
            </Accordion>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={LIGHT_GRAY} />
            <Text style={styles.emptyText}>
              No guides found for: {searchQuery}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Emergency Call Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleEmergencyCall}
          style={styles.emergencyButton}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={24} color={OFF_WHITE} />
          <Text style={styles.emergencyButtonText}>CALL EMERGENCY</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: LIGHT_GRAY,
  },
  headerContent: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 30,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  callButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    padding: 10,
    backgroundColor: SIGNAL_RED,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
    marginLeft: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    marginBottom: 24,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 1,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  guidesContainer: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginLeft: 16,
  },
  guideWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginBottom: 16,
  },
  guideWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 18,
  },
  guideStepsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
    marginBottom: 12,
  },
  guideStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: BLACK,
    lineHeight: 20,
  },
  doNotSection: {
    marginTop: 16,
  },
  doNotTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 1,
    marginBottom: 12,
  },
  doNotItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  doNotText: {
    flex: 1,
    fontSize: 13,
    color: MID_GRAY,
    marginLeft: 8,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: MID_GRAY,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SIGNAL_RED,
    paddingVertical: 16,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
