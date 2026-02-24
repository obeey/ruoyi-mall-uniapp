import request from '@/sheep/request';

export default {
  getEntryQrToken: () =>
    request({
      url: '/entry/qr/token',
      method: 'GET',
      custom: {
        auth: true,
        showLoading: true,
        loadingMsg: '生成入店码中',
      },
    }),
};
