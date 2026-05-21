export type FeaturedDramaSlide = {
  id: string;
  imageUrl: string;
  /** 无障碍描述（封面已含剧名，页面不展示文字） */
  alt: string;
};

/** 用户提供的 10 张真实短剧竖版封面 */
export const FEATURED_DRAMA_SLIDES: FeaturedDramaSlide[] = [
  {
    id: "1",
    imageUrl: "https://i.imgur.com/D0LuihB.jpeg",
    alt: "短剧封面 1",
  },
  {
    id: "2",
    imageUrl: "https://i.imgur.com/VJ6kL6L.jpeg",
    alt: "短剧封面 2",
  },
  {
    id: "3",
    imageUrl: "https://i.imgur.com/yfpKUe6.jpeg",
    alt: "短剧封面 3",
  },
  {
    id: "4",
    imageUrl: "https://i.imgur.com/x25QTtu.jpeg",
    alt: "短剧封面 4",
  },
  {
    id: "5",
    imageUrl: "https://i.imgur.com/74f8Rjc.jpeg",
    alt: "短剧封面 5",
  },
  {
    id: "6",
    imageUrl: "https://i.imgur.com/TD0AH9E.jpeg",
    alt: "短剧封面 6",
  },
  {
    id: "7",
    imageUrl: "https://i.imgur.com/LGBMdEq.jpeg",
    alt: "短剧封面 7",
  },
  {
    id: "8",
    imageUrl: "https://i.imgur.com/ob6PUuM.jpeg",
    alt: "短剧封面 8",
  },
  {
    id: "9",
    imageUrl: "https://i.imgur.com/n1FBgXK.jpeg",
    alt: "短剧封面 9",
  },
  {
    id: "10",
    imageUrl: "https://i.imgur.com/SQYB5jw.jpeg",
    alt: "短剧封面 10",
  },
];
