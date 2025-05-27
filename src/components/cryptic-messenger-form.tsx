
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lock, Unlock, Shuffle, AlertTriangle, Info, Copy, Trash2 } from "lucide-react";
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
        "This key uses a sequential scrambling cipher method, which is always reversible. Use it to encode your message.",
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
    setError(null);

    const keyDigits = key.split("").map(Number);
    let scrambledAlphabetChars = ALPHABET.split('');

    // Sequentially scramble the alphabet
    for (let i = 0; i < ALPHABET.length; i++) {
      const originalLetterToMove = ALPHABET[i]; 
      const shiftAmount = keyDigits[i];

      const currentIndexInScrambled = scrambledAlphabetChars.indexOf(originalLetterToMove);
      if (currentIndexInScrambled === -1) {
        // This should ideally not happen if logic is correct and ALPHABET is standard
        setError(`Cipher logic error: letter ${originalLetterToMove} not found during scrambling.`);
        toast({ title: "Cipher Error", description: "An internal error occurred during alphabet scrambling.", variant: "destructive" });
        setResult("");
        return;
      }

      // Remove the letter from its current position
      const letterToActuallyMove = scrambledAlphabetChars.splice(currentIndexInScrambled, 1)[0];
      
      // Calculate new index for insertion. The array is now 1 shorter (length 25).
      let newInsertionIndex;
      if (scrambledAlphabetChars.length === 0) { // Last letter being placed
        newInsertionIndex = 0;
      } else {
        // Modulo by current length of the array (which is 25 when one char is removed, until the very last step)
        newInsertionIndex = (currentIndexInScrambled + shiftAmount) % scrambledAlphabetChars.length;
         // This adjustment handles the case where the modulo result is 0 due to exact multiple of array length,
         // but it should effectively be at the end of the (current_length - 1) conceptual array.
         // E.g. if current array is ['b','c','d'] (length 3) and index 0 ('b') shifts by 3,
         // (0+3)%3 = 0. It should go after 'd'. Splice(3,0, el) inserts at end.
         if (newInsertionIndex === 0 && (currentIndexInScrambled + shiftAmount) > 0 && (currentIndexInScrambled + shiftAmount) % scrambledAlphabetChars.length === 0) {
            newInsertionIndex = scrambledAlphabetChars.length;
         }
      }
      
      // Insert the letter at the new position
      scrambledAlphabetChars.splice(newInsertionIndex, 0, letterToActuallyMove);
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

  const handleCopyMessage = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Message Copied!",
        description: "The original message has been copied to your clipboard.",
        variant: "default",
      });
    } catch (err) {
      console.error("Failed to copy message: ", err);
      toast({
        title: "Copy Failed",
        description: "Could not copy the message to the clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Result Copied!",
        description: "The processed message has been copied to your clipboard.",
        variant: "default",
      });
    } catch (err) {
      console.error("Failed to copy result: ", err);
      toast({
        title: "Copy Failed",
        description: "Could not copy the result to the clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-xl shadow-xl rounded-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-semibold text-primary">
          Caesar's Sister
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Encode and decode messages with your unique key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="message" className="font-medium">Message</Label>
            <div className="flex items-center space-x-1">
              {message && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyMessage}
                    aria-label="Copy message to clipboard"
                    className="px-2 py-1 h-auto text-xs text-muted-foreground hover:text-accent-foreground"
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessage("")}
                    aria-label="Clear message field"
                    className="px-2 py-1 h-auto text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Clear
                  </Button>
                </>
              )}
            </div>
          </div>
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
                setMessage(""); // Clear message field on mode change
                // Result field is intentionally not cleared
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
                if (val.length === 26) {
                    setError(null);
                } else {
                    setError("Key must be 26 digits.");
                }
              }
            }}
            maxLength={26}
            className={`rounded-md border-input focus:ring-ring focus:border-primary font-mono ${error && key.length !== 26 ? 'border-destructive focus:border-destructive' : ''}`}
            aria-label="Cipher key, 26 digits"
            aria-invalid={!!(error && key.length !== 26)}
            aria-describedby="key-error"
          />
          {error && key.length !==26 && (
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
          <div className="flex justify-between items-center">
            <Label htmlFor="result" className="font-medium">Result</Label>
            <div className="flex items-center space-x-1">
              {result && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResult}
                    aria-label="Copy result to clipboard"
                    className="px-2 py-1 h-auto text-xs text-muted-foreground hover:text-accent-foreground"
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResult("")}
                    aria-label="Clear result field"
                    className="px-2 py-1 h-auto text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Clear
                  </Button>
                </>
              )}
            </div>
          </div>
          <Textarea
            id="result"
            placeholder="Processed message will appear here..."
            value={result}
            readOnly
            className="min-h-[100px] bg-muted/50 rounded-md border-input font-mono"
            aria-label="Result of encoding or decoding"
          />
        </div>

        <Accordion type="single" collapsible className="w-full pt-4">
          <AccordionItem value="how-it-works">
            <AccordionTrigger className="text-base hover:no-underline">
              <div className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                How Caesar's Sister Works
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
              <p>Caesar's Sister is a substitution cipher that uses a 26-digit key to create a unique scrambled alphabet. Here's the process:</p>
              <p><strong>The Key:</strong> You provide a 26-digit numeric key (e.g., "215..."). If you're encrypting and don't provide one, a random key is generated.</p>
              <p><strong>Initial Alphabet:</strong> The process starts with the standard alphabet: "abcdefghijklmnopqrstuvwxyz".</p>
              <p><strong>Sequential Scrambling:</strong></p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>The first digit of your key determines how 'a' is moved. 'a' is found in the current (initially standard) alphabet, removed, and then re-inserted that many positions to its right (wrapping around if it goes past 'z'). The alphabet is now slightly scrambled.</li>
                <li>The second digit of your key determines how 'b' is moved. 'b' is found in this newly modified alphabet, removed, and re-inserted according to the second key digit. The alphabet becomes more scrambled.</li>
                <li>This process continues for all 26 letters of the original alphabet, from 'a' to 'z', using each of the 26 digits in your key sequentially. Each step modifies the alphabet that the next step will use.</li>
              </ul>
              <p><strong>Final Substitution:</strong> After all 26 steps, the result is a completely scrambled alphabet. This final scrambled alphabet is then used for direct substitution. For example, to encrypt, 'a' becomes the first letter of the scrambled alphabet, 'b' becomes the second, and so on. Decryption reverses this mapping.</p>
              <p>This sequential, stateful scrambling ensures that every key produces a unique one-to-one mapping between the plain alphabet and the cipher alphabet, allowing for clear encryption and decryption.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </CardContent>
    </Card>
  );
}
