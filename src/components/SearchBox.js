import { Box, Button, ButtonSpinner, ButtonText, HStack, Input, InputField, Pressable, Text, VStack } from '@gluestack-ui/themed';
import React, { useState } from 'react';
import { searchPlace } from '../services/geocoding';

/** Address search field (OpenStreetMap Nominatim) with a result list. Props: onPick(place), disabled. */
export default function SearchBox({ onPick, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await searchPlace(query.trim());
      setResults(r);
      if (r.length === 0) setMsg('No places found.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <VStack space="sm">
      <HStack space="sm" alignItems="center">
        <Input flex={1} isDisabled={disabled} variant="outline" size="md">
          <InputField
            placeholder="Search destination or tap the map"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
          />
        </Input>
        <Button size="md" action="secondary" onPress={search} isDisabled={disabled || busy}>
          {busy ? <ButtonSpinner /> : <ButtonText>Search</ButtonText>}
        </Button>
      </HStack>
      {msg && <Text size="sm" color="$error600">{msg}</Text>}
      {results.length > 0 && (
        <Box borderWidth={1} borderColor="$borderLight200" borderRadius="$md" maxHeight={160} overflow="hidden">
          {results.map((r, i) => (
            <Pressable
              key={`${r.latitude},${r.longitude},${i}`}
              px="$3"
              py="$2"
              borderTopWidth={i === 0 ? 0 : 1}
              borderColor="$borderLight100"
              onPress={() => {
                setResults([]);
                setQuery(r.label.split(',').slice(0, 2).join(','));
                onPick(r);
              }}
            >
              <Text size="sm" numberOfLines={2}>{r.label}</Text>
            </Pressable>
          ))}
        </Box>
      )}
    </VStack>
  );
}
