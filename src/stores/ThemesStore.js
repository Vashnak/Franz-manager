import WatchableStore from 'watchable-stores';
import theme from '../assets/themes/themes.json';

const ThemesStore = () => {
    let themeName = localStorage.getItem('theme') || 'theme-cashmachine';

    const store = WatchableStore({
        action: '',
        theme: theme.find(t => t.file === themeName)
    });

    store.updateTheme = theme => {
        store.data = {
            action: 'UPDATE',
            theme
        };
        setTheme(theme);
    };

    store.getTheme = () => {
        return store.data.theme;
    };

    store.initTheme = () => {
        setTheme(store.data.theme);
    };

    function setTheme(theme) {
        localStorage.setItem('theme', theme.file);
        let currentStyle = document.head.querySelectorAll('head style')[1];
        let newStyle = document.createElement('style');
        newStyle.innerText = theme.content;
        document.head.appendChild(newStyle);
        document.head.removeChild(currentStyle);
    }

    return store;
};

export default ThemesStore();
