/// <reference types="vite/client" />
import { Post } from '../.contentlayer/generated';

declare module 'virtual:contentlayer/generated' {
  export const allPosts: Array<Post>;
}
