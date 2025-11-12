declare module 'leo-profanity' {
  const leo: {
    add: (words: string[] | string) => void;
    remove: (words: string[] | string) => void;
    clearList: () => void;
    getDictionary: (lang: string) => string[];
    list: () => string[];
    check: (text: string) => boolean;
    clean: (text: string) => string;
  };
  export default leo;
}