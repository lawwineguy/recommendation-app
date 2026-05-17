export type Book = {
  title: string;
  author: string;
  genre: "sci-fi" | "fantasy" | "thriller" | "other";
};

export type StreamingService = {
  id: number;
  service_name: string;
  is_active: boolean;
};
