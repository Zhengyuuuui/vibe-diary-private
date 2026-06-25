import { Orientation, Render } from '../Render/Render';
import { Page, PageDensity } from '../Page/Page';
import { PageFlip } from '../PageFlip';
import { FlipDirection } from '../Flip/Flip';

type NumberArray = number[];

/**
 * Сlass representing a collection of pages
 */
export abstract class PageCollection {
    protected readonly app: PageFlip;
    protected readonly render: Render;
    protected readonly isShowCover: boolean;

    /** Pages List */
    protected pages: Page[] = [];
    /** Index of the current page in list */
    protected currentPageIndex = 0;

    /** Number of the current spread in book */
    protected currentSpreadIndex = 0;
    /** Two-page spread in landscape mode */
    protected landscapeSpread: NumberArray[] = [];
    /** One-page spread in portrait mode */
    protected portraitSpread: NumberArray[] = [];

    protected constructor(app: PageFlip, render: Render) {
        this.render = render;
        this.app = app;

        this.currentPageIndex = 0;
        // 从全局配置中读取 showCover 状态
        this.isShowCover = this.app.getSettings().showCover;
    }

    /**
     * Load pages
     */
    public abstract load(): void;

    /**
     * Clear pages list
     */
    public destroy(): void {
        this.pages = [];
    }

    /**
     * 核心修改部分：拆分画册并设置页面密度
     */
    protected createSpread(): void {
        this.landscapeSpread = [];
        this.portraitSpread = [];

        for (let i = 0; i < this.pages.length; i++) {
            this.portraitSpread.push([i]); // 竖屏模式：一页一展
        }

        let start = 0;
        // 1. 处理硬封面 (Front Cover)
        if (this.isShowCover && this.pages.length > 0) {
            this.pages[0].setDensity(PageDensity.HARD); // 强制第一页为硬质
            this.landscapeSpread.push([start]);
            start++;
        }

        // 2. 循环生成中间内容的双页展示
        for (let i = start; i < this.pages.length; i += 2) {
            if (i < this.pages.length - 1) {
                this.landscapeSpread.push([i, i + 1]);
            } else {
                this.landscapeSpread.push([i]);
                // 此处原本只有在奇数页时才会触发硬封底逻辑
                this.pages[i].setDensity(PageDensity.HARD);
            }
        }

        /**
         * ✅ 终极修复：强制设置封底 (Back Cover)
         * 无论页面总数是奇数还是偶数，只要开启了 showCover，最后一页必须是硬质的。
         */
        if (this.isShowCover && this.pages.length > 0) {
            this.pages[this.pages.length - 1].setDensity(PageDensity.HARD);
        }
    }

    /**
     * 根据当前模式（横屏或竖屏）获取展页数据
     */
    protected getSpread(): NumberArray[] {
        return this.render.getOrientation() === Orientation.LANDSCAPE
            ? this.landscapeSpread
            : this.portraitSpread;
    }

    /**
     * 通过页码获取其所在的展页索引
     */
    public getSpreadIndexByPage(pageNum: number): number {
        const spread = this.getSpread();

        for (let i = 0; i < spread.length; i++)
            if (pageNum === spread[i][0] || pageNum === spread[i][1]) return i;

        return null;
    }

    public getPageCount(): number {
        return this.pages.length;
    }

    public getPages(): Page[] {
        return this.pages;
    }

    public getPage(pageIndex: number): Page {
        if (pageIndex >= 0 && pageIndex < this.pages.length) {
            return this.pages[pageIndex];
        }
        throw new Error('Invalid page number');
    }

    public nextBy(current: Page): Page {
        const idx = this.pages.indexOf(current);
        if (idx < this.pages.length - 1) return this.pages[idx + 1];
        return null;
    }

    public prevBy(current: Page): Page {
        const idx = this.pages.indexOf(current);
        if (idx > 0) return this.pages[idx - 1];
        return null;
    }

    /**
     * 获取翻页时的活动页
     */
    public getFlippingPage(direction: FlipDirection): Page {
        const current = this.currentSpreadIndex;

        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            return direction === FlipDirection.FORWARD
                ? this.pages[current].newTemporaryCopy()
                : this.pages[current - 1];
        } else {
            const spread =
                direction === FlipDirection.FORWARD
                    ? this.getSpread()[current + 1]
                    : this.getSpread()[current - 1];

            if (spread.length === 1) return this.pages[spread[0]];

            return direction === FlipDirection.FORWARD
                ? this.pages[spread[0]]
                : this.pages[spread[1]];
        }
    }

    /**
     * 获取翻页时底部的静止页
     */
    public getBottomPage(direction: FlipDirection): Page {
        const current = this.currentSpreadIndex;

        if (this.render.getOrientation() === Orientation.PORTRAIT) {
            return direction === FlipDirection.FORWARD
                ? this.pages[current + 1]
                : this.pages[current - 1];
        } else {
            const spread =
                direction === FlipDirection.FORWARD
                    ? this.getSpread()[current + 1]
                    : this.getSpread()[current - 1];

            if (spread.length === 1) return this.pages[spread[0]];

            return direction === FlipDirection.FORWARD
                ? this.pages[spread[1]]
                : this.pages[spread[0]];
        }
    }

    public showNext(): void {
        if (this.currentSpreadIndex < this.getSpread().length - 1) {
            this.currentSpreadIndex++;
            this.showSpread();
        }
    }

    public showPrev(): void {
        if (this.currentSpreadIndex > 0) {
            this.currentSpreadIndex--;
            this.showSpread();
        }
    }

    public getCurrentPageIndex(): number {
        return this.currentPageIndex;
    }

    /**
     * 跳转至指定页码
     */
    public show(pageNum: number = null): void {
        if (pageNum === null) pageNum = this.currentPageIndex;
        if (pageNum < 0 || pageNum >= this.pages.length) return;

        const spreadIndex = this.getSpreadIndexByPage(pageNum);
        if (spreadIndex !== null) {
            this.currentSpreadIndex = spreadIndex;
            this.showSpread();
        }
    }

    public getCurrentSpreadIndex(): number {
        return this.currentSpreadIndex;
    }

    public setCurrentSpreadIndex(newIndex: number): void {
        if (newIndex >= 0 && newIndex < this.getSpread().length) {
            this.currentSpreadIndex = newIndex;
        } else {
            throw new Error('Invalid page');
        }
    }

    /**
     * 渲染当前展页
     */
    private showSpread(): void {
        const spread = this.getSpread()[this.currentSpreadIndex];

        if (spread.length === 2) {
            this.render.setLeftPage(this.pages[spread[0]]);
            this.render.setRightPage(this.pages[spread[1]]);
        } else {
            if (this.render.getOrientation() === Orientation.LANDSCAPE) {
                // 如果是最后一页单页显示，放在左侧
                if (spread[0] === this.pages.length - 1 && this.pages.length > 1) {
                    this.render.setLeftPage(this.pages[spread[0]]);
                    this.render.setRightPage(null);
                } else {
                    // 如果是第一页封面，放在右侧
                    this.render.setLeftPage(null);
                    this.render.setRightPage(this.pages[spread[0]]);
                }
            } else {
                this.render.setLeftPage(null);
                this.render.setRightPage(this.pages[spread[0]]);
            }
        }

        this.currentPageIndex = spread[0];
        this.app.updatePageIndex(this.currentPageIndex);
    }
}