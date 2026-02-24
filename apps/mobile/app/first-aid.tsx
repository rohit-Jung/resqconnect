import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { EMERGENCY_PHONE_NUMBER } from '@/constants';

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
    color: '#EF4444',
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
    color: '#DC2626',
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
    color: '#EF4444',
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
    color: '#6B7280',
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
        <Ionicons name={guide.icon as any} size={20} color={guide.color} />
      );
    }
    return (
      <MaterialCommunityIcons
        name={guide.icon as any}
        size={20}
        color={guide.color}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-primary px-4 pb-4 pt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text
              className="text-2xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              First Aid Guide
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleEmergencyCall}
            className="flex-row items-center rounded-full bg-white px-3 py-2"
          >
            <Ionicons name="call" size={16} color="#E13333" />
            <Text
              className="ml-1 text-sm font-semibold text-primary"
              style={{ fontFamily: 'Inter' }}
            >
              {EMERGENCY_PHONE_NUMBER}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mt-4 flex-row items-center rounded-xl bg-white/20 px-4 py-2">
          <Ionicons name="search" size={20} color="#fff" />
          <TextInput
            className="ml-2 flex-1 text-white"
            placeholder="Search first aid guides..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ fontFamily: 'Inter' }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Warning Banner */}
      <View className="mx-4 mt-4 flex-row items-start rounded-xl bg-red-50 p-4">
        <Ionicons name="warning" size={24} color="#DC2626" />
        <View className="ml-3 flex-1">
          <Text
            className="text-sm font-semibold text-red-800"
            style={{ fontFamily: 'Inter' }}
          >
            Important Notice
          </Text>
          <Text
            className="mt-1 text-xs text-red-600"
            style={{ fontFamily: 'Inter' }}
          >
            These guides are for educational purposes only. Always call
            emergency services for serious medical emergencies. When in doubt,
            seek professional help.
          </Text>
        </View>
      </View>

      {/* First Aid Guides */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {filteredGuides.length > 0 ? (
          <Accordion>
            {filteredGuides.map(guide => (
              <AccordionItem
                key={guide.id}
                title={guide.title}
                icon={guide.icon as any}
                iconColor={guide.color}
              >
                {/* Warning if present */}
                {guide.warning && (
                  <View className="mb-4 flex-row items-start rounded-lg bg-amber-50 p-3">
                    <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                    <Text
                      className="ml-2 flex-1 text-sm text-amber-800"
                      style={{ fontFamily: 'Inter' }}
                    >
                      {guide.warning}
                    </Text>
                  </View>
                )}

                {/* Steps */}
                <Text
                  className="mb-2 text-sm font-semibold text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Steps to Follow:
                </Text>
                {guide.steps.map((step, index) => (
                  <View key={index} className="mb-2 flex-row">
                    <View
                      className="mr-3 h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${guide.color}20` }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: guide.color, fontFamily: 'Inter' }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      className="flex-1 text-sm text-gray-600"
                      style={{ fontFamily: 'Inter' }}
                    >
                      {step}
                    </Text>
                  </View>
                ))}

                {/* Do Not */}
                {guide.doNot && guide.doNot.length > 0 && (
                  <View className="mt-4">
                    <Text
                      className="mb-2 text-sm font-semibold text-red-600"
                      style={{ fontFamily: 'Inter' }}
                    >
                      Do NOT:
                    </Text>
                    {guide.doNot.map((item, index) => (
                      <View key={index} className="mb-1 flex-row items-start">
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color="#DC2626"
                        />
                        <Text
                          className="ml-2 flex-1 text-sm text-gray-600"
                          style={{ fontFamily: 'Inter' }}
                        >
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <View className="items-center justify-center py-12">
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text
              className="mt-4 text-center text-gray-500"
              style={{ fontFamily: 'Inter' }}
            >
              No guides found for "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Emergency Call Floating Button */}
      <TouchableOpacity
        onPress={handleEmergencyCall}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        style={{ elevation: 8 }}
      >
        <Ionicons name="call" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
