import { config } from '../ClientEnv';

export const openTomoIDVPopup = (conn_id: string): void => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const url = new URL(config.tomoIdvUrl);
    url.searchParams.set('conn_id', conn_id);

    window.open(
        url.toString(),
        'TomoIDV',
        `width=${width},height=${height},left=${left},top=${top},popup=1,noopener,noreferrer`
    );
};
