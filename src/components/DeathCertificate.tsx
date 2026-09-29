import React from 'react';
import { PredictionRecord } from '../App';
import { Printer, ArrowLeft } from 'lucide-react';

interface DeathCertificateProps {
  caseData: PredictionRecord;
  onBack?: () => void;
  onNewAutopsy?: () => void;
}

export const DeathCertificate: React.FC<DeathCertificateProps> = ({
  caseData,
  onBack,
  onNewAutopsy,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Helper for drawing object vector in the Polaroid
  const renderObjectSpecimen = () => {
    const key = caseData.object_key || 'pencil';

    if (key === 'pencil') {
      return (
        <svg viewBox="0 0 100 180" className="w-20 h-36 drop-shadow-md">
          {/* Wood Tip */}
          <path d="M 35 50 L 50 15 L 65 50 Z" fill="#e8cf9b" stroke="#222" strokeWidth="1.5" />
          <polygon points="46,26 50,15 54,26" fill="#1f2937" />
          {/* Body */}
          <rect x="35" y="50" width="30" height="75" fill="#f59e0b" stroke="#222" strokeWidth="1.5" />
          <line x1="45" y1="50" x2="45" y2="125" stroke="#d97706" strokeWidth="1" />
          <line x1="55" y1="50" x2="55" y2="125" stroke="#d97706" strokeWidth="1" />
          {/* Ferrule */}
          <rect x="35" y="125" width="30" height="15" fill="#9ca3af" stroke="#222" strokeWidth="1.5" />
          <line x1="35" y1="132" x2="65" y2="132" stroke="#4b5563" strokeWidth="1" />
          {/* Eraser */}
          <rect x="35" y="140" width="30" height="22" rx="4" fill="#fb7185" stroke="#222" strokeWidth="1.5" />
          {/* Dead Face (x x :() */}
          <line x1="42" y1="78" x2="47" y2="83" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="47" y1="78" x2="42" y2="83" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="53" y1="78" x2="58" y2="83" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="78" x2="53" y2="83" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 44 95 Q 50 90 56 95" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === 'mug') {
      return (
        <svg viewBox="0 0 100 120" className="w-24 h-28 drop-shadow-md">
          {/* Mug body */}
          <rect x="25" y="30" width="45" height="55" rx="6" fill="#f8fafc" stroke="#222" strokeWidth="2" />
          {/* Handle */}
          <path d="M 70 42 C 85 42, 85 70, 70 70" fill="none" stroke="#222" strokeWidth="4" />
          {/* Crack line */}
          <path d="M 38 30 L 42 45 L 36 60 L 40 75" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3 1" />
          {/* Dead face */}
          <line x1="40" y1="52" x2="44" y2="56" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="52" x2="40" y2="56" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          <line x1="52" y1="52" x2="56" y2="56" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          <line x1="56" y1="52" x2="52" y2="56" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          <path d="M 44 68 Q 48 64 52 68" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === 'charger') {
      return (
        <svg viewBox="0 0 100 140" className="w-20 h-28 drop-shadow-md">
          {/* Cable with tight bend */}
          <path d="M 50 130 C 50 85, 30 75, 45 45 L 48 30" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <path d="M 45 45 L 48 30" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 3" />
          {/* Connector head */}
          <rect x="42" y="10" width="14" height="22" rx="2" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.5" />
          {/* Dead face */}
          <line x1="45" y1="18" x2="48" y2="21" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="48" y1="18" x2="45" y2="21" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="51" y1="18" x2="54" y2="21" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="54" y1="18" x2="51" y2="21" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );
    }

    // Default dead object icon with dead eyes
    return (
      <div className="flex flex-col items-center justify-center p-3">
        <span className="text-6xl mb-1 filter drop-shadow">{caseData.icon}</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono font-bold text-red-400">x x</span>
        </div>
        <div className="w-4 h-1 border-t-2 border-red-400 rounded-full mt-0.5" />
      </div>
    );
  };

  const formattedDate = caseData.date_of_prediction || '23 Sep 2026';
  const lastWords = caseData.last_known_words || '“Bro... I’m already short.”';
  const marginNote = caseData.margin_note || 'Another victim of academic pressure... ☹';
  const closingDoodle = caseData.closing_doodle || 'Short life. Big dreams.';
  const forensicNotesList = caseData.forensic_notes && caseData.forensic_notes.length > 0 
    ? caseData.forensic_notes 
    : [
        'Showed signs of wear and tear from excessive use.',
        'Poor care contributed to accelerated decline.',
        'Multiple sharpening incidents recorded.',
        'Final moments were short... just like its length.'
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action toolbar (hidden when printed) */}
      <div className="flex items-center justify-between no-print px-2">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-mono text-[#8e8e9f] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Case Dossier</span>
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#d90429] hover:bg-[#b50322] text-white text-xs font-['Chakra_Petch'] font-semibold uppercase tracking-wider rounded-md transition-all shadow-[0_4px_14px_rgba(217,4,41,0.3)] cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
          {onNewAutopsy && (
            <button
              onClick={onNewAutopsy}
              className="px-3.5 py-2 bg-[#141419] border border-[#262635] hover:border-slate-500 text-xs font-['Chakra_Petch'] text-slate-300 rounded-md transition-colors cursor-pointer"
            >
              New Autopsy
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          AUTHENTIC VINTAGE PARCHMENT CERTIFICATE CONTAINER
          ========================================================================= */}
      <div className="parchment-sheet p-6 sm:p-10 md:p-12 rounded-sm border-2 border-[#544634] shadow-2xl relative select-text overflow-hidden">
        
        {/* Vintage Ornate Corner Flourishes (SVG Vectors) */}
        {/* Top-Left Corner */}
        <div className="absolute top-3 left-3 w-12 h-12 pointer-events-none opacity-80">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#2a241b] stroke-[2.5]">
            <path d="M 5 5 L 95 5 M 5 5 L 5 95" />
            <path d="M 12 12 L 85 12 M 12 12 L 12 85" strokeWidth="1.2" />
            <circle cx="28" cy="28" r="6" />
            <path d="M 15 28 C 30 15, 45 40, 28 45" />
          </svg>
        </div>
        {/* Top-Right Corner */}
        <div className="absolute top-3 right-3 w-12 h-12 pointer-events-none opacity-80 transform scale-x-[-1]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#2a241b] stroke-[2.5]">
            <path d="M 5 5 L 95 5 M 5 5 L 5 95" />
            <path d="M 12 12 L 85 12 M 12 12 L 12 85" strokeWidth="1.2" />
            <circle cx="28" cy="28" r="6" />
            <path d="M 15 28 C 30 15, 45 40, 28 45" />
          </svg>
        </div>
        {/* Bottom-Left Corner */}
        <div className="absolute bottom-3 left-3 w-12 h-12 pointer-events-none opacity-80 transform scale-y-[-1]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#2a241b] stroke-[2.5]">
            <path d="M 5 5 L 95 5 M 5 5 L 5 95" />
            <path d="M 12 12 L 85 12 M 12 12 L 12 85" strokeWidth="1.2" />
            <circle cx="28" cy="28" r="6" />
            <path d="M 15 28 C 30 15, 45 40, 28 45" />
          </svg>
        </div>
        {/* Bottom-Right Corner */}
        <div className="absolute bottom-3 right-3 w-12 h-12 pointer-events-none opacity-80 transform scale-[-1]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#2a241b] stroke-[2.5]">
            <path d="M 5 5 L 95 5 M 5 5 L 5 95" />
            <path d="M 12 12 L 85 12 M 12 12 L 12 85" strokeWidth="1.2" />
            <circle cx="28" cy="28" r="6" />
            <path d="M 15 28 C 30 15, 45 40, 28 45" />
          </svg>
        </div>

        {/* Inner Vintage Hairline Border */}
        <div className="border border-[#2a241b]/70 p-4 sm:p-6 md:p-8">
          
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-[#2a241b]/30 gap-4">
            {/* Top Left: MORTEM Logo Stamp */}
            <div className="text-left">
              <div className="flex items-center gap-1.5 font-['Chakra_Petch'] font-bold text-2xl tracking-tighter text-[#1f1a14]">
                <span>M</span>
                <span className="inline-block relative">
                  <span className="text-[#1f1a14]">O</span>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#1f1a14]">☠</span>
                </span>
                <span>RTEM™</span>
              </div>
              <div className="font-handwriting text-sm text-[#4a3f33] italic leading-tight mt-0.5">
                The Unnecessarily Serious<br />Object Lifespan Predictor
              </div>
            </div>

            {/* Top Right: Tagline */}
            <div className="text-right flex items-center gap-2">
              <div className="font-typewriter text-xs text-[#3d3429] leading-tight max-w-[210px]">
                Because even your pencil deserves to know when it will die.
              </div>
              <span className="text-xl text-[#1f1a14]">💀</span>
            </div>
          </div>

          {/* Main Title Section */}
          <div className="text-center py-6 border-b border-[#2a241b]/30">
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              {/* Left Flourish */}
              <div className="hidden sm:block w-16 h-4 opacity-70">
                <svg viewBox="0 0 100 24" className="w-full h-full stroke-[#1f1a14] fill-none stroke-2">
                  <path d="M 100 12 C 70 12, 60 2, 40 2 C 20 2, 10 22, 0 12" />
                </svg>
              </div>

              <h2 className="font-vintage-title text-2xl sm:text-4xl md:text-5xl font-black tracking-wider text-[#1a1612] uppercase drop-shadow-sm">
                DIGITAL DEATH CERTIFICATE
              </h2>

              {/* Right Flourish */}
              <div className="hidden sm:block w-16 h-4 opacity-70 transform scale-x-[-1]">
                <svg viewBox="0 0 100 24" className="w-full h-full stroke-[#1f1a14] fill-none stroke-2">
                  <path d="M 100 12 C 70 12, 60 2, 40 2 C 20 2, 10 22, 0 12" />
                </svg>
              </div>
            </div>

            <div className="font-typewriter text-xs sm:text-sm tracking-[0.25em] text-[#3d3429] uppercase mt-2 font-bold">
              OFFICIAL RECORD OF AN OBJECT’S FINAL DAYS
            </div>
          </div>

          {/* Upper Info Grid: Polaroid + Metadata + Status Stamp */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 border-b border-[#2a241b]/30 items-center">
            
            {/* 1. Polaroid Specimen Photo */}
            <div className="md:col-span-4 flex items-center justify-center relative">
              <div className="relative bg-[#fcf9f2] p-2.5 pb-5 rounded-xs shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-[#d6c7b0] transform -rotate-2 hover:rotate-0 transition-transform">
                {/* Vintage Tape at top */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-14 h-5 bg-[#ecd5a5]/80 backdrop-blur-xs border border-[#d3be92]/60 rotate-1" />
                
                {/* Dark Photo Frame */}
                <div className="bg-[#1c1a17] w-36 h-44 rounded-xs flex items-center justify-center p-2 overflow-hidden border border-[#111]">
                  {renderObjectSpecimen()}
                </div>
              </div>

              {/* Handwritten Note + Arrow */}
              <div className="absolute -right-4 sm:right-2 bottom-1 sm:bottom-4 pointer-events-none">
                <div className="font-handwriting text-lg sm:text-xl font-bold text-[#1f1a14] leading-tight rotate-12">
                  RIP little<br />legend
                </div>
                <svg viewBox="0 0 50 30" className="w-8 h-6 stroke-[#1f1a14] fill-none stroke-2 -rotate-12 mt-1">
                  <path d="M 40 5 Q 20 25, 5 15" strokeLinecap="round" />
                  <path d="M 12 10 L 5 15 L 14 20" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* 2. Typewriter Key-Value Table matching Requirement 7 */}
            <div className="md:col-span-5 font-typewriter text-xs sm:text-sm text-[#2b261f] space-y-2">
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Case ID</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#1a1612]">MRT-{caseData.case_id}</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Object</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#1a1612] text-sm sm:text-base">{caseData.object_name}</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Status</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#b31b1b] tracking-wider">DECEASED</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Date of Death</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#1a1612]">{caseData.date_of_death || formattedDate}</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Time of Death</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#1a1612]">{caseData.time_of_death || '14:32:00'}</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Survival Probability</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#b31b1b]">{caseData.survival_probability}%</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Final Classification</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#b31b1b]">DECEASED</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Usage</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#1a1612]">{caseData.usage}</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Condition</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#1a1612]">{caseData.condition}%</span>
              </div>
              <div className="flex">
                <span className="w-36 shrink-0 text-[#4a3f33]">Care</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-[#1a1612]">{caseData.care}</span>
              </div>
            </div>

            {/* 3. Red Rubber Stamp Box */}
            <div className="md:col-span-3 flex justify-center">
              <div className="border border-[#b31b1b]/50 p-3 bg-[#faefe5]/50 rounded-xs text-center w-48 relative">
                <div className="font-typewriter text-[11px] font-bold text-[#b31b1b] tracking-widest uppercase mb-1">
                  STATUS
                </div>
                
                {/* Distressed Stamp */}
                <div className="rubber-stamp px-3 py-1 text-2xl font-black border-4 border-[#b31b1b] text-[#b31b1b] transform -rotate-3 my-1">
                  DECEASED
                </div>

                <div className="text-[#b31b1b] text-base my-0.5">💀</div>
                <div className="border-t border-[#b31b1b]/40 my-1.5" />
                
                <div className="font-typewriter text-[10px] text-[#554536] uppercase tracking-wider mb-1">
                  Final Status
                </div>
                <div className="bg-[#b31b1b] text-white font-typewriter font-bold text-xs py-1 px-3 rounded-full uppercase tracking-wider shadow-xs">
                  DECEASED
                </div>
              </div>
            </div>
          </div>

          {/* Officially Declared Banner (Requirement 7) */}
          <div className="py-3 px-4 border-2 border-dashed border-[#b31b1b] rounded-xs bg-[#b31b1b]/5 text-center mb-6">
            <div className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-[#554536] font-bold">
              OFFICIALLY DECLARED
            </div>
            <div className="font-vintage-title text-2xl sm:text-3xl font-black text-[#b31b1b] tracking-wider uppercase mt-0.5">
              "UNNECESSARILY DECEASED"
            </div>
            <div className="font-typewriter text-[11px] text-[#3d3429] mt-0.5">
              Under MORTEM Codex · All functional capabilities permanently terminated.
            </div>
          </div>

          {/* Lower Grid: Metrics + Forensic Notes Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 border-b border-[#2a241b]/30">
            
            {/* Left 6 Cols: Metrics with Icons */}
            <div className="md:col-span-6 space-y-4 font-typewriter text-xs text-[#2b261f]">
              {/* Estimated Remaining Life */}
              <div className="flex items-start gap-3 pb-3 border-b border-[#2a241b]/20">
                <span className="text-xl mt-0.5">🕒</span>
                <div>
                  <div className="text-[11px] text-[#4a3f33]">Estimated Remaining Life</div>
                  <div className="font-bold text-base text-[#1a1612]">{caseData.remaining_formatted}</div>
                </div>
              </div>

              {/* Survival Probability */}
              <div className="flex items-start gap-3 pb-3 border-b border-[#2a241b]/20">
                <span className="text-xl mt-0.5">🛡️</span>
                <div>
                  <div className="text-[11px] text-[#4a3f33]">Survival Probability</div>
                  <div className="font-bold text-base text-[#1a1612]">{caseData.survival_probability}%</div>
                </div>
              </div>

              {/* Predicted Cause of Death */}
              <div className="flex items-start gap-3 pb-3 border-b border-[#2a241b]/20">
                <span className="text-xl mt-0.5">💀</span>
                <div>
                  <div className="text-[11px] text-[#4a3f33]">Predicted Cause of Death</div>
                  <div className="font-bold text-sm text-[#1a1612] leading-snug">
                    {caseData.cause_of_death}
                  </div>
                </div>
              </div>

              {/* Last Known Words */}
              <div className="flex items-start gap-3 pb-3 border-b border-[#2a241b]/20">
                <span className="text-xl mt-0.5">💬</span>
                <div>
                  <div className="text-[11px] text-[#4a3f33]">Last Known Words</div>
                  <div className="font-bold text-sm text-[#1a1612] italic">
                    {lastWords}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">💡</span>
                <div>
                  <div className="text-[11px] text-[#4a3f33]">Recommendation</div>
                  <div className="font-bold text-xs text-[#1a1612]">
                    {caseData.recommended_action}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Slanted Margin Note */}
            <div className="hidden lg:flex md:col-span-1 items-center justify-center">
              <div className="font-handwriting text-xl text-[#3d3429] font-bold transform -rotate-12 whitespace-nowrap leading-tight">
                {marginNote}
              </div>
            </div>

            {/* Right 5 Cols: Forensic Notes Box */}
            <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between">
              <div className="border border-[#2a241b]/40 rounded-xs p-4 bg-[#f8f3e6]/70 relative">
                {/* Black Tag Title */}
                <div className="absolute -top-3 left-4 bg-[#1f1a14] text-white font-typewriter text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  FORENSIC NOTES
                </div>

                {/* Bullet Points */}
                <ul className="font-typewriter text-xs text-[#2b261f] space-y-2 mt-2 list-disc list-inside">
                  {forensicNotesList.map((note, idx) => (
                    <li key={idx} className="leading-snug">
                      <span className="font-normal">{note}</span>
                    </li>
                  ))}
                </ul>

                {/* Slanted CASE CLOSED Red Stamp */}
                <div className="mt-5 pt-3 border-t border-[#2a241b]/10 flex justify-end">
                  <div className="rubber-stamp px-3 py-1.5 text-center transform -rotate-6 border-2 border-[#b31b1b] text-[#b31b1b]">
                    <div className="text-xs font-black tracking-widest">CASE CLOSED</div>
                    <div className="text-[10px] font-bold tracking-wider">R.I.P. {caseData.object_name.toUpperCase()} ❤️</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Signature, Circular Seal, Whimsical Doodle */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            
            {/* 1. Signature */}
            <div className="text-left">
              <div className="font-signature text-2xl text-[#1a365d] transform -rotate-3 mb-1">
                Dr. Byte
              </div>
              <div className="w-36 border-b border-[#2a241b]/60 mb-1" />
              <div className="font-typewriter text-xs font-bold text-[#1a1612]">Chief Objectologist</div>
              <div className="font-typewriter text-[10px] text-[#4a3f33]">MORTEM™</div>
            </div>

            {/* 2. Red Rubber Circular Seal */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#b31b1b] flex flex-col items-center justify-center p-1 text-[#b31b1b] transform -rotate-6">
                <div className="text-[7px] font-typewriter font-bold tracking-tighter uppercase">★ MORTEM™ ★</div>
                <div className="text-2xl my-0.5">💀</div>
                <div className="text-[7px] font-typewriter font-bold uppercase tracking-tight text-center leading-none">
                  CERTIFIED OBJECT<br />DEATH REPORT
                </div>
              </div>
            </div>

            {/* 3. Whimsical Doodle */}
            <div className="text-right flex items-center justify-end gap-2">
              <div className="font-handwriting text-lg text-[#2b261f] font-bold leading-tight transform -rotate-2">
                {closingDoodle}
              </div>
              <span className="text-2xl transform rotate-12">✏️</span>
              <span className="font-handwriting text-sm text-[#b31b1b]">♡</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
