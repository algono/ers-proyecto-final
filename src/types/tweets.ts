export type Tweet = {
  ceo: string;
  tweet: string;
  date: Date; // ISO date string
  company?: string; // Optional: If not provided we just use the stock company name (e.g. "TWTR" for "Twitter")
  stockCompany: string;
  stockChange: number;
  history: number[];
  ceoImage?: string; // Optional: file name of the CEO's image for better UI
};