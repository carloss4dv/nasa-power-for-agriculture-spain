const mockAxiosResponse = {
  data: {
    properties: {
      parameter: {
        T2M: {
          units: "C",
          20220101: 15.5,
          20220102: 16.2
        },
        T2M_MAX: {
          units: "C",
          20220101: 22.3,
          20220102: 23.1
        },
        T2M_MIN: {
          units: "C",
          20220101: 10.2,
          20220102: 11.5
        },
        PRECTOTCORR: {
          units: "mm/day",
          20220101: 0.5,
          20220102: 5.2
        },
        RH2M: {
          units: "%",
          20220101: 65.3,
          20220102: 78.9
        },
        TSOIL1: {
          units: "C",
          20220101: 14.2,
          20220102: 14.8
        },
        EVLAND: {
          units: "mm/day",
          20220101: 3.5,
          20220102: 2.8
        }
      }
    }
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {}
};

export default {
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(mockAxiosResponse),
    defaults: {
      baseURL: '',
      headers: {
        common: {}
      }
    }
  })),
  isAxiosError: jest.fn().mockImplementation((error) => {
    return error && error.isAxiosError === true;
  })
}; 