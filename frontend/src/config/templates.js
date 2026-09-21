/**
 * GlacierWatch Emergency SMS Templates
 *
 * NOTE: The Nepali translations below must be reviewed by a native speaker or the
 * local disaster management authority before any live field operation.
 */

export const SMS_TEMPLATES = [
  {
    id: 'flood_warning',
    name: 'Flood warning',
    english: "Flood warning: possible glacial lake outburst flood upstream. Move away from the river to higher ground now. Follow local authorities' instructions.",
    nepali: "बाढी चेतावनी: माथिल्लो भागमा हिमताल विस्फोट बाढीको सम्भावना छ। तुरुन्तै नदी किनारबाट टाढा उच्च स्थानमा जानुहोस्। स्थानीय अधिकारीको निर्देशन पालना गर्नुहोस्।",
  },
  {
    id: 'evacuate_now',
    name: 'Evacuate now',
    english: "Evacuate now: flood danger at the river. Leave the riverbank immediately and go to the nearest high, safe ground.",
    nepali: "तुरुन्तै सुरक्षित स्थानमा जानुहोस्: नदीमा बाढीको खतरा छ। नदी किनार छोडेर नजिकैको उच्च र सुरक्षित स्थानमा जानुहोस्।",
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    english: "Earthquake alert: strong shaking detected. Stay away from the riverbank and steep slopes; landslides and floods may follow. Move to open, higher ground.",
    nepali: "भूकम्प चेतावनी: तीव्र कम्पन महसुस भयो। नदी किनार र भिरालो जमिनबाट टाढा रहनुहोस्; पहिरो र बाढी आउन सक्छ। खुला र उच्च स्थानमा जानुहोस्।",
  },
  {
    id: 'all_clear',
    name: 'All clear',
    english: "All clear: the earlier warning has ended. Stay alert and follow local authorities' updates.",
    nepali: "खतरा टरेको सूचना: अघिल्लो चेतावनी समाप्त भएको छ। सतर्क रहनुहोस् र स्थानीय अधिकारीको सूचना पालना गर्नुहोस्।",
  },
  {
    id: 'test_message',
    name: 'Test message',
    english: "This is a GlacierWatch test message. No action is needed.",
    nepali: "यो GlacierWatch को परीक्षण सन्देश हो। कुनै कारबाही आवश्यक छैन।",
  },
];

// Basic GSM-7 character set tester
const GSM_7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\^{}\\[~\]|€]*$/;

export function calculateSmsSegments(text) {
  if (!text || text.length === 0) {
    return {
      encoding: 'GSM-7',
      chars: 0,
      segments: 0,
      maxPerSegment: 160,
      remainingInSegment: 160,
    };
  }

  const isGsm7 = GSM_7_REGEX.test(text);
  const encoding = isGsm7 ? 'GSM-7' : 'UCS-2';
  const charCount = text.length;

  if (encoding === 'GSM-7') {
    if (charCount <= 160) {
      return {
        encoding,
        chars: charCount,
        segments: 1,
        maxPerSegment: 160,
        remainingInSegment: 160 - charCount,
      };
    } else {
      const segments = Math.ceil(charCount / 153);
      const remainingInSegment = segments * 153 - charCount;
      return {
        encoding,
        chars: charCount,
        segments,
        maxPerSegment: 153,
        remainingInSegment,
      };
    }
  } else {
    // UCS-2 (e.g. Nepali / Devanagari)
    if (charCount <= 70) {
      return {
        encoding,
        chars: charCount,
        segments: 1,
        maxPerSegment: 70,
        remainingInSegment: 70 - charCount,
      };
    } else {
      const segments = Math.ceil(charCount / 67);
      const remainingInSegment = segments * 67 - charCount;
      return {
        encoding,
        chars: charCount,
        segments,
        maxPerSegment: 67,
        remainingInSegment,
      };
    }
  }
}
