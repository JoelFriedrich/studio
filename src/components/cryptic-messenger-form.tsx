
"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Unlock, Shuffle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export default function CrypticMessengerForm() {
  const [message, setMessage] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateRandomKey = useCallback(() => {
    // Reverted to original: generates 26 random digits (0-9)
    const newKey = Array.from({ length: 26 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    setKey(newKey);
    setError(null);
    toast({
      title: "New Random Key Generated",
      description:
        "This key will be validated for reversibility upon use. Many random digit keys may not form a reversible cipher with the current logic.",
      variant: "default",
      duration: 7000,
    });
  }, [toast]);

  useEffect(() => {
    if (mode === "encode" && key === "") {
      generateRandomKey();
    }
  }, [mode, key, generateRandomKey]);

  const applyCipher = useCallback(() => {
    if (key.length !== 26 || !/^\d{26}$/.test(key)) {
      setError("Key must be 26 digits.");
      toast({
        title: "Invalid Key Format",
        description: "Cipher key must be exactly 26 digits.",
        variant: "destructive",
      });
      setResult("");
      return;
    }

    const keyDigits = key.split("").map(Number);

    // Step 1: Construct the cipherAlphabetArray based on myFunction's logic
    // cipherAlphabetArray[targetIndex] = originalPlainChar
    // This means ALPHABET[i] (plainChar) is placed at targetIndex in the cipherAlphabetArray.
    const cipherAlphabetArray = new Array(ALPHABET.length).fill(null);
    let isKeyValidForPermutation = true;

    for (let i = 0; i < ALPHABET.length; i++) {
      const plainChar = ALPHABET[i]; // The original character e.g. 'a', 'b', ...
      const shiftAmount = keyDigits[i]; // The shift from the key for this plainChar
      const targetIndexOfPlainCharInCipherAlphabet =
        (ALPHABET.indexOf(plainChar) + shiftAmount) % ALPHABET.length;

      if (cipherAlphabetArray[targetIndexOfPlainCharInCipherAlphabet] !== null) {
        // Collision: Another plainChar already mapped to this targetIndex.
        isKeyValidForPermutation = false;
        break;
      }
      cipherAlphabetArray[targetIndexOfPlainCharInCipherAlphabet] = plainChar;
    }

    // Step 2: Validate if the generated cipherAlphabetArray forms a valid permutation
    // It must have no collisions (checked by isKeyValidForPermutation)
    // and all positions must be filled (no nulls).
    if (
      !isKeyValidForPermutation ||
      cipherAlphabetArray.some((char) => char === null)
    ) {
      const newError =
        "Invalid key: This key leads to ambiguous encryption (not all characters map uniquely or some are missing) and is not reversible. Please generate a new key or use a different one.";
      setError(newError);
      toast({
        title: "Invalid Key for Reversible Cipher",
        description:
          "The current key creates ambiguities or missing mappings, making perfect decryption impossible. Many random digit keys will fail this check. Please generate a new key or use a different one.",
        variant: "destructive",
        duration: 7000,
      });
      setResult("");
      return;
    }

    setError(null);
    // finalCipherAlphabetString is the result of myFunction's construction.
    // finalCipherAlphabetString[j] is the *original* ALPHABET letter that maps to cipher position j.
    const finalCipherAlphabetString = cipherAlphabetArray.join("");

    // Step 3: Build encode and decode maps
    // If finalCipherAlphabetString[j] = s_j (an original char), then s_j encrypts to ALPHABET[j].
    const encodeMap = new Map<string, string>();
    const decodeMap = new Map<string, string>();

    for (let j = 0; j < ALPHABET.length; j++) {
      const originalLetterThatLandsAtJ = finalCipherAlphabetString[j]; // This is s_j
      const standardAlphabetLetterForOutput = ALPHABET[j];           // This is ALPHABET[j]

      // encodeMap: originalChar -> encryptedChar
      encodeMap.set(originalLetterThatLandsAtJ, standardAlphabetLetterForOutput);
      // decodeMap: encryptedChar -> originalChar
      decodeMap.set(standardAlphabetLetterForOutput, originalLetterThatLandsAtJ);
    }

    // Step 4: Apply the cipher to the message
    let output = "";
    for (const char of message) {
      const charLower = char.toLowerCase();
      let processedChar = char;

      if (ALPHABET.includes(charLower)) {
        if (mode === "encode") {
          processedChar = encodeMap.get(charLower) || charLower; // Fallback should ideally not happen if maps are complete
        } else {
          processedChar = decodeMap.get(charLower) || charLower; // Fallback should ideally not happen
        }
        if (char === char.toUpperCase()) {
          processedChar = processedChar.toUpperCase();
        }
      }
      output += processedChar;
    }
    setResult(output);
  }, [message, key, mode, toast]);

  return (
    <Card className="w-full max-w-xl shadow-xl rounded-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-semibold text-primary">
          Cryptic Messenger
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Encode and decode your messages with a custom cipher.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="message" className="font-medium">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] rounded-md border-input focus:ring-ring focus:border-primary font-mono"
            aria-label="Message to encode or decode"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="mode" className="font-medium">Mode</Label>
            <Select
              value={mode}
              onValueChange={(value: "encode" | "decode") => {
                setMode(value);
                setResult("");
                setError(null); // Clear error when mode changes
                if (value === 'encode' && key === "") {
                  generateRandomKey();
                }
              }}
            >
              <SelectTrigger id="mode" className="w-full rounded-md border-input focus:ring-ring focus:border-primary" aria-label="Select mode: Encode or Decode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="encode">
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4" /> Encode
                  </div>
                </SelectItem>
                <SelectItem value="decode">
                  <div className="flex items-center">
                    <Unlock className="mr-2 h-4 w-4" /> Decode
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "encode" && (
            <Button
              onClick={generateRandomKey}
              variant="outline"
              className="w-full sm:w-auto justify-self-start sm:justify-self-end rounded-md border-primary text-primary hover:bg-primary/10"
              aria-label="Generate random cipher key"
            >
              <Shuffle className="mr-2 h-4 w-4" /> Generate Key
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="key" className="font-medium">Cipher Key (26 digits)</Label>
          <Input
            id="key"
            type="text"
            placeholder="Enter 26-digit key"
            value={key}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              if (val.length <= 26) {
                setKey(val);
                setError(null); // Clear error when key changes
              }
            }}
            maxLength={26}
            className={`rounded-md border-input focus:ring-ring focus:border-primary font-mono ${error ? 'border-destructive focus:border-destructive' : ''}`}
            aria-label="Cipher key, 26 digits"
            aria-invalid={!!error}
            aria-describedby="key-error"
          />
          {error && (
            <p id="key-error" className="flex items-center text-sm text-destructive mt-1">
              <AlertTriangle className="mr-1 h-4 w-4" /> {error}
            </p>
          )}
        </div>

        <Button
          onClick={applyCipher}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-md py-3 text-base font-semibold"
          aria-label={mode === "encode" ? "Encode Message" : "Decode Message"}
        >
          {mode === "encode" ? (
            <Lock className="mr-2 h-5 w-5" />
          ) : (
            <Unlock className="mr-2 h-5 w-5" />
          )}
          {mode === "encode" ? "Encode Message" : "Decode Message"}
        </Button>

        <div className="space-y-2">
          <Label htmlFor="result" className="font-medium">Result</Label>
          <Textarea
            id="result"
            placeholder="Processed message will appear here..."
            value={result}
            readOnly
            className="min-h-[100px] bg-muted/50 rounded-md border-input font-mono"
            aria-label="Result of encoding or decoding"
          />
        </div>
      </CardContent>
    </Card>
  );
}
