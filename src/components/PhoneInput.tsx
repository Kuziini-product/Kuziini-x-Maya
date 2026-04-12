"use client";

import { useState, useRef } from "react";

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  format: string; // e.g. "### ### ###" for 9-digit numbers
}

const COUNTRIES: Country[] = [
  { code: "RO", dial: "+40", flag: "\u{1F1F7}\u{1F1F4}", name: "Romania", format: "### ### ###" },
  { code: "MD", dial: "+373", flag: "\u{1F1F2}\u{1F1E9}", name: "Moldova", format: "## ### ###" },
  { code: "DE", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}", name: "Germania", format: "### ### ####" },
  { code: "GB", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}", name: "UK", format: "#### ### ###" },
  { code: "FR", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}", name: "Franta", format: "# ## ## ## ##" },
  { code: "IT", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}", name: "Italia", format: "### ### ####" },
  { code: "ES", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}", name: "Spania", format: "### ### ###" },
  { code: "US", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}", name: "SUA", format: "### ### ####" },
  { code: "AT", dial: "+43", flag: "\u{1F1E6}\u{1F1F9}", name: "Austria", format: "### ### ####" },
  { code: "HU", dial: "+36", flag: "\u{1F1ED}\u{1F1FA}", name: "Ungaria", format: "## ### ####" },
  { code: "BG", dial: "+359", flag: "\u{1F1E7}\u{1F1EC}", name: "Bulgaria", format: "## ### ####" },
  { code: "TR", dial: "+90", flag: "\u{1F1F9}\u{1F1F7}", name: "Turcia", format: "### ### ####" },
  { code: "GR", dial: "+30", flag: "\u{1F1EC}\u{1F1F7}", name: "Grecia", format: "### ### ####" },
  { code: "PL", dial: "+48", flag: "\u{1F1F5}\u{1F1F1}", name: "Polonia", format: "### ### ###" },
  { code: "NL", dial: "+31", flag: "\u{1F1F3}\u{1F1F1}", name: "Olanda", format: "# ## ### ###" },
  { code: "CZ", dial: "+420", flag: "\u{1F1E8}\u{1F1FF}", name: "Cehia", format: "### ### ###" },
  { code: "CH", dial: "+41", flag: "\u{1F1E8}\u{1F1ED}", name: "Elvetia", format: "## ### ## ##" },
  { code: "SE", dial: "+46", flag: "\u{1F1F8}\u{1F1EA}", name: "Suedia", format: "## ### ## ##" },
  { code: "IL", dial: "+972", flag: "\u{1F1EE}\u{1F1F1}", name: "Israel", format: "## ### ####" },
  { code: "AE", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}", name: "UAE", format: "## ### ####" },
];

/** Format a number string with spaces according to pattern */
function formatNumber(digits: string, pattern: string): string {
  let result = "";
  let digitIdx = 0;
  for (const ch of pattern) {
    if (digitIdx >= digits.length) break;
    if (ch === "#") {
      result += digits[digitIdx];
      digitIdx++;
    } else {
      result += ch;
    }
  }
  // Append remaining digits if pattern is shorter
  if (digitIdx < digits.length) {
    result += digits.slice(digitIdx);
  }
  return result;
}

/** Extract only digits from input */
function onlyDigits(str: string): string {
  return str.replace(/\D/g, "");
}

interface Props {
  value: string; // full international number e.g. "+40723456789"
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function PhoneInput({ value, onChange, placeholder, className, autoFocus }: Props) {
  // Parse initial value to find country
  const initialCountry = COUNTRIES.find((c) => value.startsWith(c.dial)) || COUNTRIES[0];
  const initialDigits = value.startsWith(initialCountry.dial)
    ? value.slice(initialCountry.dial.length).replace(/\D/g, "")
    : value.replace(/\D/g, "");

  const [country, setCountry] = useState(initialCountry);
  const [digits, setDigits] = useState(initialDigits);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDigitsChange(raw: string) {
    const d = onlyDigits(raw);
    // Remove leading 0 if present (e.g. user types 0723 instead of 723)
    const cleaned = d.startsWith("0") ? d.slice(1) : d;
    setDigits(cleaned);
    onChange(`${country.dial}${cleaned}`);
  }

  function selectCountry(c: Country) {
    setCountry(c);
    setShowDropdown(false);
    onChange(`${c.dial}${digits}`);
    inputRef.current?.focus();
  }

  const formatted = formatNumber(digits, country.format);

  return (
    <div className={`relative ${className || ""}`}>
      <div className="flex">
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 px-2.5 bg-white/[0.08] border border-white/[0.1] border-r-0 text-white text-sm shrink-0"
        >
          <span className="text-lg">{country.flag}</span>
          <span className="text-xs text-white/60">{country.dial}</span>
          <span className="text-[8px] text-white/30">&#9660;</span>
        </button>

        {/* Number input */}
        <input
          ref={inputRef}
          type="tel"
          value={formatted}
          onChange={(e) => handleDigitsChange(e.target.value)}
          className="flex-1 bg-white/[0.06] border border-white/[0.1] px-3 py-3 text-white text-sm tracking-wider font-mono outline-none focus:border-maya-gold/50 placeholder:text-white/30"
          placeholder={placeholder || formatNumber("712345678", country.format)}
          autoFocus={autoFocus}
          inputMode="tel"
        />
      </div>

      {/* Full number preview */}
      {digits.length > 0 && (
        <p className="text-maya-gold text-[10px] mt-1 font-mono tracking-wider">
          {country.dial} {formatted}
        </p>
      )}

      {/* Country dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1a1a] border border-white/[0.15] max-h-[250px] overflow-y-auto shadow-xl">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => selectCountry(c)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/[0.06] ${
                c.code === country.code ? "bg-maya-gold/10 text-maya-gold" : "text-white/80"
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="font-medium">{c.name}</span>
              <span className="text-white/40 ml-auto text-xs">{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
