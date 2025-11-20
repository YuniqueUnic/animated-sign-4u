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

        // Style & Color labels
        cardBackgroundLabel: "Card Background",
        transparentLabel: "Transparent",
        backgroundModeLabel: "Background Mode",
        textureLabel: "Texture",
        textureColorLabel: "Color",
        textureSizeLabel: "Size",
        textureThicknessLabel: "Thickness",
        textureOpacityLabel: "Opacity",
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
        themeNameChinese: "Chinese Red",
        themeNameCyber: "Cyber",
        themeNamePepsi: "Pepsi",
        themeNameCoke: "Coke",
        themeNameSprite: "Sprite",
        themeNameInk: "Ink",
        themeNameJade: "Jade",
        themeNameLaser: "Laser",
        themeNameRainbow: "Rainbow",

        // Texture options
        textureNoneLabel: "None",
        textureGridLabel: "Grid",
        textureDotsLabel: "Dots",
        textureLinesLabel: "Lines",
        textureCrossLabel: "Cross",

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

        // Mobile topbar labels
        mobileDownloadLabel: "Download",
        mobileCodeLabel: "Code",

        // Download menu labels
        downloadPngLabel: "PNG Image",
        downloadGifLabel: "GIF Image",
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

        // Style & Color labels
        cardBackgroundLabel: "卡片背景",
        transparentLabel: "透明",
        backgroundModeLabel: "背景模式",
        textureLabel: "纹理",
        textureColorLabel: "颜色",
        textureSizeLabel: "纹理尺寸",
        textureThicknessLabel: "线条粗细",
        textureOpacityLabel: "不透明度",
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
        themeNameCyber: "赛博",
        themeNamePepsi: "百事",
        themeNameCoke: "可口可乐",
        themeNameSprite: "雪碧",
        themeNameInk: "水墨",
        themeNameJade: "翡翠",
        themeNameLaser: "激光",
        themeNameRainbow: "彩虹",

        // Texture options
        textureNoneLabel: "无",
        textureGridLabel: "网格",
        textureDotsLabel: "圆点",
        textureLinesLabel: "线条",
        textureCrossLabel: "十字",

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

        // Mobile topbar labels
        mobileDownloadLabel: "下载",
        mobileCodeLabel: "代码",

        // Download menu labels
        downloadPngLabel: "PNG 图片",
        downloadGifLabel: "GIF 图片",
    },
} as const;

export type MessageKey = keyof typeof messages.en;

export function translate(locale: Locale, key: MessageKey): string {
    const table = messages[locale] ?? messages.en;
    return table[key] ?? messages.en[key];
}
