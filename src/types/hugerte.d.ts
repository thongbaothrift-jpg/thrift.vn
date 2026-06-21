declare module 'hugerte' {
  const Hugerte: {
    init: (config: Record<string, unknown>) => { get: (id: string) => unknown };
    get: (id: string) => unknown;
  };
  export default Hugerte;
}

declare module 'hugerte/models/dom';
declare module 'hugerte/models/dom/model.js';
declare module 'hugerte/skins/ui/oxide/skin';
declare module 'hugerte/skins/ui/oxide/content';
declare module 'hugerte/skins/content/default/content';
declare module 'hugerte/plugins/accordion';
declare module 'hugerte/plugins/advlist';
declare module 'hugerte/plugins/anchor';
declare module 'hugerte/plugins/autolink';
declare module 'hugerte/plugins/autoresize';
declare module 'hugerte/plugins/autosave';
declare module 'hugerte/plugins/charmap';
declare module 'hugerte/plugins/code';
declare module 'hugerte/plugins/codesample';
declare module 'hugerte/plugins/directionality';
declare module 'hugerte/plugins/emoticons';
declare module 'hugerte/plugins/fullscreen';
declare module 'hugerte/plugins/help';
declare module 'hugerte/plugins/image';
declare module 'hugerte/plugins/insertdatetime';
declare module 'hugerte/plugins/link';
declare module 'hugerte/plugins/lists';
declare module 'hugerte/plugins/media';
declare module 'hugerte/plugins/nonbreaking';
declare module 'hugerte/plugins/pagebreak';
declare module 'hugerte/plugins/preview';
declare module 'hugerte/plugins/quickbars';
declare module 'hugerte/plugins/save';
declare module 'hugerte/plugins/searchreplace';
declare module 'hugerte/plugins/table';
declare module 'hugerte/plugins/template';
declare module 'hugerte/plugins/visualblocks';
declare module 'hugerte/plugins/visualchars';
declare module 'hugerte/plugins/wordcount';
declare module 'hugerte/plugins/emoticons/js/emojis';
declare module 'hugerte/plugins/help/js/i18n/keynav/en';
