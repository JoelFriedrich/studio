
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
    const constantShiftDigit = Math.floor(Math.random() * 10); // Generates a number from 0 to 9
    const newKey = String(constantShiftDigit).repeat(26); // Creates a string like "333...3"
    
    setKey(newKey);
    setError(null); // This key type is guaranteed to be a permutation.
    
    toast({
      title: "Valid Key Generated",
      description: `A new key using a constant shift of ${constantShiftDigit} has been set. This key is guaranteed to be reversible.`,
      variant: "default",
      duration: 6000, 
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

    const forwardMapValues = new Array(ALPHABET.length);
    for (let i = 0; i < ALPHABET.length; i++) {
      const shift = keyDigits[i];
      forwardMapValues[i] = (i + shift) % ALPHABET.length;
    }

    const uniqueForwardMapOutputs = new Set(forwardMapValues);
    const isPermutation = uniqueForwardMapOutputs.size === ALPHABET.length;

    if (!isPermutation) {
      const newError = "Invalid key: This key leads to ambiguous encryption and is not reversible. Please generate a new key or use a different one.";
      setError(newError);
      toast({
        title: "Invalid Key for Reversible Cipher",
        description: "The current key creates ambiguities, making perfect decryption impossible. Please generate a new key or use a different one.",
        variant: "destructive",
        duration: 7000,
      });
      setResult("");
      return;
    }

    setError(null); 

    const encodeMap = new Map<string, string>();
    const decodeMap = new Map<string, string>();

    for (let i = 0; i < ALPHABET.length; i++) {
      const originalChar = ALPHABET[i];
      const encodedCharIndex = forwardMapValues[i]; 
      const encodedChar = ALPHABET[encodedCharIndex];
      
      encodeMap.set(originalChar, encodedChar);
      decodeMap.set(encodedChar, originalChar); 
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
              onClick={() => {
                generateRandomKey(); // This will now set a valid key and clear errors
              }}
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
              const val = e.target.value.replace(/[^0-9]/g, ''); 
              if (val.length <= 26) {
                setKey(val);
                // Error state will be managed by applyCipher or generateRandomKey
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
