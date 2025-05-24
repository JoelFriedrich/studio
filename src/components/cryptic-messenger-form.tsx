
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
    const newKey = Array.from({ length: 26 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    setKey(newKey);
    setError(null);
    toast({
      title: "New Random Key Generated",
      description:
        "This key will be used with a sequential scrambling cipher method, which is always reversible.",
      variant: "default",
      duration: 5000,
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
    setError(null); // Clear format error if key is now valid

    const keyDigits = key.split("").map(Number);
    const originalAlphabetArray = ALPHABET.split('');
    let scrambledAlphabetChars = [...originalAlphabetArray];

    // Sequentially scramble the alphabet
    for (let i = 0; i < ALPHABET.length; i++) {
      const letterToMove = ALPHABET[i]; // The original i-th letter (e.g., 'a', then 'b', ...)
      const shiftAmount = keyDigits[i];

      const currentIndexInScrambled = scrambledAlphabetChars.indexOf(letterToMove);
      if (currentIndexInScrambled === -1) {
        // This should not happen if logic is correct
        setError("Cipher logic error: letter not found during scrambling.");
        toast({ title: "Cipher Error", description: "An internal error occurred.", variant: "destructive" });
        setResult("");
        return;
      }

      // Remove the letter from its current position
      scrambledAlphabetChars.splice(currentIndexInScrambled, 1);

      // Calculate new index for insertion (in the array of 25 letters)
      const newInsertionIndex = (currentIndexInScrambled + shiftAmount) % scrambledAlphabetChars.length;
      
      // Insert the letter at the new position
      scrambledAlphabetChars.splice(newInsertionIndex, 0, letterToMove);
    }

    const finalScrambledAlphabet = scrambledAlphabetChars.join('');

    const encodeMap = new Map<string, string>();
    const decodeMap = new Map<string, string>();

    for (let i = 0; i < ALPHABET.length; i++) {
      encodeMap.set(ALPHABET[i], finalScrambledAlphabet[i]);
      decodeMap.set(finalScrambledAlphabet[i], ALPHABET[i]);
    }

    let output = "";
    for (const char of message) {
      const charLower = char.toLowerCase();
      let processedChar = char;

      if (ALPHABET.includes(charLower)) {
        if (mode === "encode") {
          processedChar = encodeMap.get(charLower) || charLower;
        } else {
          processedChar = decodeMap.get(charLower) || charLower;
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
                setError(null); 
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
                setError(null); 
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
