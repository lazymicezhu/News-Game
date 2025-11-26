// 新闻看板管理模块
import { newsItems } from '../data/newsData.js';
import { localize, t } from './i18n.js';

class NewsBoard {
    constructor() {
        this.newsContainer = null;
        this.timeDisplay = null;
        this.timerId = null;
        this.maxVisibleNews = 8; // 最多显示8条新闻

        // 游戏时间系统（1秒真实时间 = 1分钟游戏时间）
        this.gameTime = { hour: 8, minute: 30 }; // 从08:30开始
        this.startTime = { hour: 8, minute: 30 };

        // 已显示的新闻索引集合
        this.displayedNewsIndices = new Set();
    }

    /**
     * 初始化新闻看板
     */
    init() {
        this.newsContainer = document.querySelector('.news-board-list');
        this.timeDisplay = document.getElementById('game-time');

        if (!this.newsContainer) {
            console.warn('新闻看板容器未找到');
            return;
        }

        if (!this.timeDisplay) {
            console.warn('时间显示元素未找到');
        }

        this.updateLabels();

        // 清空现有内容
        this.newsContainer.innerHTML = '';

        // 重置时间
        this.gameTime = { ...this.startTime };
        this.displayedNewsIndices.clear();

        // 更新时间显示
        this.updateTimeDisplay();

        // 开始时间循环
        this.start();
    }

    /**
     * 开始时间系统
     */
    start() {
        // 清除可能存在的定时器
        if (this.timerId) {
            clearInterval(this.timerId);
        }

        // 检查并显示当前时间的新闻
        this.checkAndShowNews();

        // 每1秒真实时间 = 1分钟游戏时间
        this.timerId = setInterval(() => {
            this.advanceTime();
            this.updateTimeDisplay();
            this.checkAndShowNews();
        }, 1000);
    }

    /**
     * 停止时间系统
     */
    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    /**
     * 重启新闻看板
     */
    restart() {
        this.stop();
        this.init();
    }

    /**
     * 推进游戏时间（增加1分钟）
     */
    advanceTime() {
        this.gameTime.minute += 1;

        // 处理分钟进位
        if (this.gameTime.minute >= 60) {
            this.gameTime.minute = 0;
            this.gameTime.hour += 1;
        }

        // 处理小时进位（24小时制）
        if (this.gameTime.hour >= 24) {
            this.gameTime.hour = 0;
        }
    }

    /**
     * 更新时间显示
     */
    updateTimeDisplay() {
        if (!this.timeDisplay) return;

        const timeStr = this.formatTime(this.gameTime.hour, this.gameTime.minute);
        this.timeDisplay.textContent = timeStr;
    }

    /**
     * 格式化时间为 HH:MM
     * @param {number} hour - 小时
     * @param {number} minute - 分钟
     * @returns {string} 格式化的时间字符串
     */
    formatTime(hour, minute) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    /**
     * 检查并显示与当前游戏时间匹配的新闻
     */
    checkAndShowNews() {
        const currentTimeStr = this.formatTime(this.gameTime.hour, this.gameTime.minute);

        // 遍历所有新闻，找到匹配当前时间且未显示的新闻
        newsItems.forEach((newsItem, index) => {
            if (newsItem.time === currentTimeStr && !this.displayedNewsIndices.has(index)) {
                this.addNewsItem(newsItem, index);
                this.displayedNewsIndices.add(index);
                this.removeExcessNews();
            }
        });
    }

    /**
     * 添加新闻项到列表顶部
     * @param {Object} newsItem - 新闻数据 { time, text }
     */
    addNewsItem(newsItem, index) {
        // 创建新闻元素
        const newsElement = document.createElement('div');
        newsElement.className = 'news-item news-item-enter';
        if (typeof index === 'number') {
            newsElement.dataset.index = index;
        }

        const timeElement = document.createElement('div');
        timeElement.className = 'news-time';
        timeElement.textContent = newsItem.time;

        const textElement = document.createElement('div');
        textElement.className = 'news-text';
        textElement.textContent = localize(newsItem.text);

        newsElement.appendChild(timeElement);
        newsElement.appendChild(textElement);

        // 插入到列表顶部
        this.newsContainer.insertBefore(newsElement, this.newsContainer.firstChild);

        // 触发动画
        requestAnimationFrame(() => {
            newsElement.classList.remove('news-item-enter');
            newsElement.classList.add('news-item-active');
        });
    }

    /**
     * 移除超出数量限制的旧新闻
     */
    removeExcessNews() {
        const newsElements = this.newsContainer.querySelectorAll('.news-item');

        // 如果新闻数量超过最大限制
        if (newsElements.length > this.maxVisibleNews) {
            // 从底部开始移除多余的新闻
            for (let i = this.maxVisibleNews; i < newsElements.length; i++) {
                const item = newsElements[i];

                // 添加移除动画
                item.classList.add('news-item-exit');

                // 动画结束后移除元素
                setTimeout(() => {
                    if (item.parentNode) {
                        item.parentNode.removeChild(item);
                    }
                }, 300); // 与CSS动画时长匹配
            }
        }
    }

    /**
     * 清空所有新闻
     */
    clear() {
        this.stop();
        if (this.newsContainer) {
            this.newsContainer.innerHTML = '';
        }
        this.displayedNewsIndices.clear();
    }

    /**
     * 获取当前游戏时间
     * @returns {string} 格式化的时间字符串
     */
    getCurrentTime() {
        return this.formatTime(this.gameTime.hour, this.gameTime.minute);
    }

    updateLabels() {
        const titleEl = document.querySelector('.news-board-title');
        const subEl = document.querySelector('.news-board-sub');
        if (titleEl) titleEl.textContent = t('liveBoardTitle');
        if (subEl) subEl.textContent = t('liveBoardSub');
    }

    refreshLanguage() {
        this.updateLabels();
        if (!this.newsContainer) return;
        this.newsContainer.querySelectorAll('.news-item').forEach(item => {
            const idx = parseInt(item.dataset.index, 10);
            if (Number.isNaN(idx)) return;
            const news = newsItems[idx];
            if (!news) return;
            const textEl = item.querySelector('.news-text');
            if (textEl) {
                textEl.textContent = localize(news.text);
            }
        });
    }
}

// 导出单例
export const newsBoard = new NewsBoard();
