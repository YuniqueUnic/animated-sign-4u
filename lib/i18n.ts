export type Locale = "en" | "zh";

export const messages = {
  en: {
    appTitle: "Animated Signature 4u",
    exportComponent: "Export Component",
    reactComponent: "React Component",
    vueComponent: "Vue Component",
    jsComponent: "HTML / JS",
    svgButton: "SVG",
    apiAndCode: "API & Code",

    // Sidebar section titles
    contentFontSectionTitle: "Content & Font",
    paramsSectionTitle: "Parameters",
    quickThemesSectionTitle: "Quick Themes",
    styleColorSectionTitle: "Style & Color",

    // Content & Font labels
    signatureTextLabel: "Signature Text",
    fontFamilyLabel: "Font Family",
    fontCategoryScript: "Script",
    fontCategoryBrand: "Brand",
    fontCategoryLocal: "Local",
    fontCategoryCustom: "Custom",
    uploadFontLabel: "Upload Font...",

    // Parameters labels
    fontSizeLabel: "Font Size",
    animationSpeedLabel: "Animation Speed",
    charSpacingLabel: "Character Spacing",
    hanziStrokeModeLabel: "Chinese Stroke Mode",
    hanziStrokeModeDescription: "Draw Chinese characters stroke by stroke",
    repeatLabel: "Loop animation",
    repeatDescription:
      "When enabled, the animation will keep looping instead of playing once",
    repeatTooltip:
      "When combined with 'Erase after animation', the signature will draw → hold → erase in a continuous loop (requires SVG SMIL animation support).",
    eraseOnCompleteLabel: "Erase after animation",
    eraseOnCompleteDescription:
      "After drawing, erase the signature and optionally loop when repeat is enabled",
    gifExportSettings: "GIF Export Settings",
    gifFpsLabel: "Frame Rate",
    gifFpsDescription: "Higher FPS = smoother animation, larger file",
    gifQualityLabel: "Quality",
    gifQualityDescription: "Lower value = better quality, larger file (1-20)",
    gifDialogTitle: "GIF Export",
    gifDialogDescription: "Adjust GIF settings, then start generation.",
    gifGeneratingLabel: "Generating GIF...",
    gifStartButtonLabel: "Generate & Download",
    gifCancelButtonLabel: "Cancel",
    gifGenerateErrorLabel: "Failed to generate GIF. Please try again.",

    // Style & Color labels
    cardBackgroundLabel: "Card Background",
    transparentLabel: "Transparent",
    backgroundModeLabel: "Background Mode",
    textureLabel: "Texture",
    textureColorLabel: "Color",
    textureSizeLabel: "Size",
    textureThicknessLabel: "Thickness",
    textureOpacityLabel: "Opacity",

    linkFillStrokeLabel: "Link fill & stroke",
    cornerRadiusLabel: "Corner Radius",
    backgroundSizeLabel: "Background Size",
    bgWidthLabel: "Width",
    bgHeightLabel: "Height",
    strokeColorLabel: "Stroke Color",
    enableLabel: "Enable",
    fillModeLabel: "Fill Mode",
    glowTitle: "Glow",
    glowDescription: "Neon light effect",
    shadowTitle: "Shadow",
    shadowDescription: "3D drop shadow",
    multiScrollHint: "Scroll to edit all characters",

    // Drawer header labels
    drawerCollapseLabel: "Collapse",
    drawerOpenLabel: "Open",

    // Theme names
    themeNameDefault: "Default",
    themeNameSchool: "School",
    themeNameBlueprint: "Blueprint",
    themeNameChinese: "Chinese",
    themeNameCyber: "Cyber",
    themeNamePepsi: "Pepsi",
    themeNameCoke: "Coke",
    themeNameSprite: "Sprite",
    themeNameInk: "Ink",
    themeNameJade: "Jade",
    themeNameLaser: "Laser",
    themeNameRainbow: "Rainbow",
    themeNamePractice: "Practice",

    // Texture options
    textureNoneLabel: "None",
    textureGridLabel: "Grid",
    textureDotsLabel: "Dots",
    textureLinesLabel: "Lines",
    textureCrossLabel: "Cross",
    textureTianzigeLabel: "Tianzige",
    textureMizigeLabel: "Mizige",

    // Mode labels
    bgModeSolidLabel: "Solid",
    bgModeGradientLabel: "Gradient",
    bgSizeAutoLabel: "Auto",
    bgSizeCustomLabel: "Custom",
    strokeModeSingleLabel: "Single",
    strokeModeGradientLabel: "Gradient",
    strokeModeMultiLabel: "Multi",
    fillModeSingleLabel: "Single",
    fillModeGradientLabel: "Gradient",
    fillModeMultiLabel: "Multi",

    // Mobile/topbar labels
    mobileDownloadLabel: "Download",
    mobileCodeLabel: "Code",
    themeToggleLabel: "Toggle theme",
    githubRepoLabel: "View project on GitHub",
    shareButtonLabel: "Share",
    shareCopiedMessage: "Share URL copied to clipboard.",
    sharePromptLabel: "Copy this URL to share:",
    shareCopyLabel: "Copy link",
    shareNativeLabel: "Share",
    shareCopySuccessLabel: "Copied",
    shareCopyErrorLabel: "Copy failed",

    // Landing (quick mode)
    landingEnterEditorLabel: "Open advanced editor",
    landingPreviewAlt: "Signature preview",
    landingChineseLabel: "Chinese",
    landingHanziStrokeLabel: "Hanzi strokes",
    landingHint:
      "Type to generate an embeddable image URL, then copy Markdown / HTML / URL.",
    landingCopyLabel: "Copy",
    landingCopiedLabel: "Copied",
    landingIssueLabel: "Issue 01",
    landingArtQuoteLabel: "The art of digital presence starts with a stroke.",
    landingPreviewRenderingLabel: "Preview Rendering",
    landingDigitalSignatureLabel: "Digital Signature(Typing below pls)",
    landingInputPlaceholder: "Type your signature here...",
    landingCuratedControlLabel: "Curated Control",
    landingTailoredLabel:
      "Not only tailored for developers & designers, but you!",
    landingAssetCollectionLabel: "Asset Collection",
    speedLabel: "Speed",

    // Download menu labels
    downloadPngLabel: "PNG Image",
    downloadGifLabel: "GIF Image",
    downloadSvgAnimatedLabel: "SVG (Animated)",
    downloadSvgStaticLabel: "SVG (Static)",
  },
  zh: {
    appTitle: "动态签名 4u",
    exportComponent: "导出组件",
    reactComponent: "React 组件",
    vueComponent: "Vue 组件",
    jsComponent: "HTML / JS",
    svgButton: "SVG 图像",
    apiAndCode: "API 与代码",

    // Sidebar section titles
    contentFontSectionTitle: "内容与字体",
    paramsSectionTitle: "参数",
    quickThemesSectionTitle: "快捷主题",
    styleColorSectionTitle: "样式与颜色",

    // Content & Font labels
    signatureTextLabel: "签名文本",
    fontFamilyLabel: "字体",
    fontCategoryScript: "连笔体",
    fontCategoryBrand: "品牌",
    fontCategoryLocal: "本地",
    fontCategoryCustom: "自定义",
    uploadFontLabel: "上传字体...",

    // Parameters labels
    fontSizeLabel: "字体大小",
    animationSpeedLabel: "动画速度",
    charSpacingLabel: "字符间距",
    hanziStrokeModeLabel: "汉字笔画模式",
    hanziStrokeModeDescription: "按笔画顺序绘制中文字符",
    repeatLabel: "循环播放",
    repeatDescription: "是否循环播放整个动画",
    repeatTooltip:
      "与「动画结束后擦除」一起使用时，动画会按 路径绘制 → 停留 → 擦除 的顺序循环播放（需要浏览器支持 SVG SMIL 动画）。",
    eraseOnCompleteLabel: "动画结束后擦除",
    eraseOnCompleteDescription:
      "动画绘制完成后擦除签名，配合循环可以形成往复动画",
    gifExportSettings: "GIF 导出设置",
    gifFpsLabel: "帧率",
    gifFpsDescription: "帧率越高动画越流畅，文件越大",
    gifQualityLabel: "画质",
    gifQualityDescription: "数值越小质量越高，文件越大 (1-20)",
    gifDialogTitle: "GIF 导出",
    gifDialogDescription: "调整 GIF 的导出参数，然后开始生成。",
    gifGeneratingLabel: "GIF 制作中，请耐心等待...",
    gifStartButtonLabel: "生成并下载",
    gifCancelButtonLabel: "取消",
    gifGenerateErrorLabel: "GIF 生成失败，请稍后重试。",

    // Style & Color labels
    cardBackgroundLabel: "卡片背景",
    transparentLabel: "透明",
    backgroundModeLabel: "背景模式",
    textureLabel: "纹理",
    textureColorLabel: "颜色",
    textureSizeLabel: "纹理尺寸",
    textureThicknessLabel: "线条粗细",
    textureOpacityLabel: "不透明度",

    linkFillStrokeLabel: "填充/描边联动",
    cornerRadiusLabel: "圆角",
    backgroundSizeLabel: "背景尺寸",
    bgWidthLabel: "宽度",
    bgHeightLabel: "高度",
    strokeColorLabel: "描边颜色",
    enableLabel: "启用",
    fillModeLabel: "填充模式",
    glowTitle: "发光",
    glowDescription: "霓虹灯效果",
    shadowTitle: "阴影",
    shadowDescription: "3D 投影",
    multiScrollHint: "左右滚动编辑全部字符",

    // Drawer header labels
    drawerCollapseLabel: "收起",
    drawerOpenLabel: "展开",

    // Theme names
    themeNameDefault: "默认",
    themeNameSchool: "校园",
    themeNameBlueprint: "蓝图",
    themeNameChinese: "中国红",
    themeNameCyber: "赛博朋克",
    themeNamePepsi: "百事",
    themeNameCoke: "可口可乐",
    themeNameSprite: "雪碧",
    themeNameInk: "水墨",
    themeNameJade: "翡翠",
    themeNameLaser: "激光",
    themeNameRainbow: "彩虹",
    themeNamePractice: "摹本",

    // Texture options
    textureNoneLabel: "无",
    textureGridLabel: "网格",
    textureDotsLabel: "圆点",
    textureLinesLabel: "线条",
    textureCrossLabel: "十字",
    textureTianzigeLabel: "田字格",
    textureMizigeLabel: "米字格",

    // Mode labels
    bgModeSolidLabel: "纯色",
    bgModeGradientLabel: "渐变",
    bgSizeAutoLabel: "自动",
    bgSizeCustomLabel: "自定义",
    strokeModeSingleLabel: "单色",
    strokeModeGradientLabel: "渐变",
    strokeModeMultiLabel: "多色",
    fillModeSingleLabel: "单色",
    fillModeGradientLabel: "渐变",
    fillModeMultiLabel: "多色",

    // Mobile/topbar labels
    mobileDownloadLabel: "下载",
    mobileCodeLabel: "代码",
    themeToggleLabel: "切换主题",
    githubRepoLabel: "查看 GitHub 仓库",
    shareButtonLabel: "分享",
    shareCopiedMessage: "分享链接已复制到剪贴板。",
    sharePromptLabel: "复制此链接进行分享：",
    shareCopyLabel: "复制链接",
    shareNativeLabel: "系统分享",
    shareCopySuccessLabel: "复制成功",
    shareCopyErrorLabel: "复制失败",

    // Landing（快速模式）
    landingEnterEditorLabel: "进入高级编辑页面",
    landingPreviewAlt: "签名预览",
    landingChineseLabel: "中文",
    landingHanziStrokeLabel: "中文笔画",
    landingHint:
      "输入文字后会实时生成可嵌入的图片 URL；支持复制 Markdown / HTML / 直链。",
    landingCopyLabel: "复制",
    landingCopiedLabel: "已复制",
    landingIssueLabel: "第 01 期",
    landingArtQuoteLabel: "数字存在的艺术，始于一笔一划。",
    landingPreviewRenderingLabel: "预览渲染",
    landingDigitalSignatureLabel: "数字签名 (请于下方输入)",
    landingInputPlaceholder: "在此输入您的签名...",
    landingCuratedControlLabel: "精选控制",
    landingTailoredLabel: "找到属于你的那份签名吧",
    landingAssetCollectionLabel: "资产集合",
    speedLabel: "速度",

    // Download menu labels
    downloadPngLabel: "PNG 图片",
    downloadGifLabel: "GIF 图片",
    downloadSvgAnimatedLabel: "SVG (动态)",
    downloadSvgStaticLabel: "SVG (静态)",
  },
} as const;

export type MessageKey = keyof typeof messages.en;

export function translate(locale: Locale, key: MessageKey): string {
  const table = messages[locale] ?? messages.en;
  return table[key] ?? messages.en[key];
}
