import React, { useState, useEffect, useRef } from "react";

const EMOJI_CATEGORIES = {
  "Smileys & People": [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😶‍🌫️", "😐", "😑", "😬", "🫨", "🫠", "🤥", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "😟", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "🫥", "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸"
  ],
  "Animals & Nature": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🐦‍⬛", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦞", "🦀", "🦐", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐑", "🐐", "🦌", "🐕", "🐩", "🐈", "🐈‍⬛", "🐓", "🦃", "🦤", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥", "🦘", "🦛", "🐁", "🐀", "🐿️", "🦔", "🌲", "🌳", "🌴", "🌵", "🌿", "🍀", "🍁", "🍂", "🍃", "🍄", "🐚", "🪨", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌙", "🪐", "💫", "⭐️", "🌟", "✨", "⚡️", "☄️", "💥", "🔥", "🌪️", "🌈", "☀️", "🌤️", "⛅️", "🌥️", "☁️", "🌦️", "🌧️", "🌨️", "🌩️", "🌪️", "🌫️", "🌬️", "🌊", "💧", "💦", "☔️"
  ],
  "Food & Drink": [
    "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🫓", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🥘", "🫕", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚", "🍘", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "☕️", "🫖", "🍵", "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🧊", "🥢", "🍽️", "🍴", "🥄"
  ],
  "Activities": [
    "⚽️", "🏀", "🏈", "⚾️", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳️", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "skateboard", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚴", "🚵", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰", "🧩"
  ],
  "Travel & Places": [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🚲", "🛴", "🛹", "🛺", "🚂", "🚋", "🚄", "🚅", "🚈", "🚞", "🚊", "🚝", "🚆", "🚇", "🚈", "✈️", "🚀", "🚁", "⛵️", "🚢", "🛫", "🛬", "🛰️", "🚠", "🚟", "⚓️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏙️", "🌆", "🌇", "🎆", "🌉", "🌌", "🏢", "🏠", "🏡", "🏘️", "🏫", "🏭", "🏰", "🕌", "⛪️", "🏛️", "🗾", "🗽", "🗼"
  ],
  "Objects & Symbols": [
    "⌚️", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "DVD", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎎", "🎛️", "🧭", "⏱️", "⏳", "⌛️", "⏰", "🪙", "💵", "💴", "💶", "💷", "💳", "🪪", "💎", "⚖️", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "⚙️", "⛓️", "🔫", "💣", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "⚱️", "🔮", "🪄", "📿", "🧿", "💈", "🧲", "🧪", "🧫", "🧬", "🔭", "🔬", "🕳️", "🩹", "🩺", "🔑", "🗝️", "🚪", "🪞", "🪟", "🛏️", "🛋️", "🪑", "🚽", "🪠", "🚿", "🛁", "🧼", "🪥", "🧽", "🪣", "🧹", "🧺", "🎈", "🎉", "🎊", "🎁", "🪄", "🪅", "🧧", "✉️", "📧", "📨", "📩", "📤", "📥", "📦", "🏷️", "📁", "📂", "📅", "📆", "🗓️", "🗒️", "📈", "📉", "📊", "📋", "📌", "📍", "📎", "🖇️", "📐", "📏", "📚", "📖", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "📰", "🗞️", "📓", "✏️", "✒️", "🖋️", "🖊️", "🪶", "🖍️", "📝", "💼", "🔒", "🔓", "🔏", "🔐", "🔑", "🗝️", "🔨", "🪓", "🏹", "🛡️", "🔧", "⚙️", "🔩", "⛓️", "🧪", "🧫", "🧬", "🔭", "🔬", "🩹", "🩺", "🌡️", "🕯️", "🪔", "🏮", "🧱", "🪤", "🪙", "🔔", "🔕", "📢", "📣", "📯", "✉️", "📪", "📬", "📮", "📝", "📁", "📂", "📅", "📆", "🔍", "🔎", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "🔀", "🔁", "🔂", "▶️", "⏩", "⏭", "🎦", "📶", "📳", "📴", "⚠️", "🛟"
  ]
};

const EMOJI_NAMES = {
  "😀": "smile happy grinning smiley",
  "😃": "smile happy grinning smiley",
  "😄": "smile happy laughing smiley",
  "😁": "smile happy laughing teeth",
  "😆": "smile happy laughing squint",
  "😅": "smile happy sweat cold laugh",
  "😂": "laugh cry tear joy haha lol",
  "🤣": "laugh roll floor haha lol rofl",
  "😊": "smile happy proud blush pleased",
  "😇": "angel halo innocent holy",
  "🙂": "smile slight simple",
  "🙃": "upside down silly flip",
  "😉": "wink play wink smiley",
  "😌": "relieved calm peace happy",
  "😍": "heart eyes love adore like romantic",
  "🥰": "hearts blush love crush affection",
  "😘": "kiss blow heart kissy romantic",
  "👍": "thumbs up yes ok good nice accept",
  "👎": "thumbs down no bad dislike reject",
  "👌": "ok sign perfect nice okay alright",
  "✌️": "peace victory sign scissors hand",
  "🙏": "please pray thank you gratitude hands folded",
  "❤️": "heart love red emotion affection",
  "🔥": "fire hot burn lit outstanding trend",
  "✨": "sparkles shine star glitter glow magic",
  "🌟": "star shine outstanding brightness",
  "🍔": "burger food hamburger fast food",
  "🍕": "pizza food cheese slice italian",
  "🍟": "fries french fries potato fast food",
  "☕️": "coffee tea drink mug cafe warm hot",
  "🚗": "car drive auto vehicle travel",
  "💡": "idea bulb light intelligence lamp concept"
};

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  const [activeCategory, setActiveCategory] = useState("Smileys & People");
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef(null);

  // Click outside to close picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Filters emojis based on query
  const getFilteredEmojis = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return EMOJI_CATEGORIES[activeCategory] || [];
    }

    const results = [];
    Object.values(EMOJI_CATEGORIES).forEach((emojis) => {
      emojis.forEach((emoji) => {
        const keywords = EMOJI_NAMES[emoji] || "";
        if (keywords.includes(q)) {
          results.push(emoji);
        }
      });
    });

    if (results.length === 0) {
      Object.values(EMOJI_CATEGORIES).forEach((emojis) => {
        emojis.forEach((emoji) => {
          if (emoji.includes(q)) {
            results.push(emoji);
          }
        });
      });
    }

    return results;
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-[65px] left-2 z-[999] flex w-[280px] sm:w-[320px] flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900 animate-fade-in"
    >
      {/* Search Input */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-250 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
      </div>

      {/* Category Selection Tabs */}
      {!searchQuery && (
        <div className="mb-2 flex gap-1 overflow-x-auto border-b border-slate-100 pb-1.5 dark:border-slate-800/80 scrollbar-none">
          {Object.keys(EMOJI_CATEGORIES).map((category) => {
            const firstEmoji = EMOJI_CATEGORIES[category][0];
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-lg px-2 py-1 text-xs transition-colors shrink-0 ${
                  activeCategory === category
                    ? "bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white"
                    : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
                title={category}
              >
                <span className="text-base mr-1">{firstEmoji}</span>
                <span className="hidden sm:inline text-[9px] uppercase tracking-wide">
                  {category.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-7 gap-1 h-44 overflow-y-auto pr-1 scrollbar-thin">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90"
          >
            {emoji}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <div className="col-span-7 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8 text-xs font-semibold">
            <span>🔍</span>
            <span>No emojis found</span>
          </div>
        )}
      </div>
    </div>
  );
}
