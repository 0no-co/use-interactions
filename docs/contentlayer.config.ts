import { defineDocumentType, makeSource } from 'contentlayer/source-files';

export type DocHeading = { level: 1 | 2 | 3; title: string };

export const Doc = defineDocumentType(() => ({
  name: 'Doc',
  filePathPattern: `./**/*.md`,
  fields: {
    title: {
      type: 'string',
      description: 'The title of the page',
      required: true,
    },
  },
  extensions: {},
}));

export default makeSource({
  contentDirPath: './content',
  documentTypes: [Doc],
});
