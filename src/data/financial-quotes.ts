// Financial quotes database categorized by topic
export interface FinancialQuote {
  text: string;
  author: string;
  category: 'financial-literacy' | 'financial-freedom' | 'motivation';
}

export const FINANCIAL_QUOTES: FinancialQuote[] = [
  // Financial Literacy
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "financial-literacy"
  },
  {
    text: "It's not how much money you make, but how much money you keep, how hard it works for you, and how many generations you keep it for.",
    author: "Robert Kiyosaki",
    category: "financial-literacy"
  },
  {
    text: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make, so you can give money back and have money to invest.",
    author: "Dave Ramsey",
    category: "financial-literacy"
  },
  {
    text: "Do not save what is left after spending; instead spend what is left after saving.",
    author: "Warren Buffett",
    category: "financial-literacy"
  },
  {
    text: "The stock market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
    category: "financial-literacy"
  },
  {
    text: "Know what you own, and know why you own it.",
    author: "Peter Lynch",
    category: "financial-literacy"
  },
  {
    text: "The individual investor should act consistently as an investor and not as a speculator.",
    author: "Ben Graham",
    category: "financial-literacy"
  },
  {
    text: "Price is what you pay. Value is what you get.",
    author: "Warren Buffett",
    category: "financial-literacy"
  },
  
  // Financial Freedom
  {
    text: "The goal isn't more money. The goal is living life on your terms.",
    author: "Chris Brogan",
    category: "financial-freedom"
  },
  {
    text: "Financial freedom is available to those who learn about it and work for it.",
    author: "Robert Kiyosaki",
    category: "financial-freedom"
  },
  {
    text: "The rich invest in time, the poor invest in money.",
    author: "Warren Buffett",
    category: "financial-freedom"
  },
  {
    text: "Wealth is the ability to fully experience life.",
    author: "Henry David Thoreau",
    category: "financial-freedom"
  },
  {
    text: "It's not about having lots of money. It's about knowing how to manage the money you do have.",
    author: "Dave Ramsey",
    category: "financial-freedom"
  },
  {
    text: "Money is a terrible master but an excellent servant.",
    author: "P.T. Barnum",
    category: "financial-freedom"
  },
  {
    text: "The quickest way to double your money is to fold it in half and put it in your back pocket.",
    author: "Will Rogers",
    category: "financial-freedom"
  },
  
  // Motivation
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: "motivation"
  },
  {
    text: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
    category: "motivation"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "motivation"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "motivation"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "motivation"
  },
  {
    text: "Wealth is not about having a lot of money; it's about having a lot of options.",
    author: "Chris Rock",
    category: "motivation"
  },
  {
    text: "Every time you borrow money, you're robbing your future self.",
    author: "Nathan W. Morris",
    category: "motivation"
  },
  {
    text: "The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order, trains to forethought, and so broadens the mind.",
    author: "T.T. Munger",
    category: "motivation"
  },
  {
    text: "Too many people spend money they haven't earned, to buy things they don't want, to impress people they don't like.",
    author: "Will Rogers",
    category: "motivation"
  },
  {
    text: "A budget is telling your money where to go instead of wondering where it went.",
    author: "Dave Ramsey",
    category: "motivation"
  },
  {
    text: "Beware of little expenses. A small leak will sink a great ship.",
    author: "Benjamin Franklin",
    category: "motivation"
  },
  {
    text: "Never spend your money before you have earned it.",
    author: "Thomas Jefferson",
    category: "motivation"
  }
];

// Get a random quote for the day (deterministic based on date)
export function getQuoteOfTheDay(): FinancialQuote {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % FINANCIAL_QUOTES.length;
  return FINANCIAL_QUOTES[index];
}

// Get a random quote
export function getRandomQuote(): FinancialQuote {
  return FINANCIAL_QUOTES[Math.floor(Math.random() * FINANCIAL_QUOTES.length)];
}

// Get quotes by category
export function getQuotesByCategory(category: FinancialQuote['category']): FinancialQuote[] {
  return FINANCIAL_QUOTES.filter(q => q.category === category);
}
