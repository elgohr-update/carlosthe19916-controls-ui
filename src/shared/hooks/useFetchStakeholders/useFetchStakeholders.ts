import { useCallback, useReducer } from "react";
import { AxiosError } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

import { getStakeholders, getAllStakeholders } from "api/rest";
import {
  PageRepresentation,
  Stakeholder,
  PageQuery,
  SortByQuery,
} from "api/models";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchStakeholders/fetch/request",
  "useFetchStakeholders/fetch/success",
  "useFetchStakeholders/fetch/failure"
)<void, PageRepresentation<Stakeholder>, AxiosError>();

type State = Readonly<{
  isFetching: boolean;
  stakeholders?: PageRepresentation<Stakeholder>;
  fetchError?: AxiosError;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  stakeholders: undefined,
  fetchError: undefined,
  fetchCount: 0,
};

type Action = ActionType<
  typeof fetchRequest | typeof fetchSuccess | typeof fetchFailure
>;

const initReducer = (isFetching: boolean): State => {
  return {
    ...defaultState,
    isFetching,
  };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case getType(fetchRequest):
      return {
        ...state,
        isFetching: true,
      };
    case getType(fetchSuccess):
      return {
        ...state,
        isFetching: false,
        fetchError: undefined,
        stakeholders: action.payload,
        fetchCount: state.fetchCount + 1,
      };
    case getType(fetchFailure):
      return {
        ...state,
        isFetching: false,
        fetchError: action.payload,
        fetchCount: state.fetchCount + 1,
      };
    default:
      return state;
  }
};

export interface IState {
  stakeholders?: PageRepresentation<Stakeholder>;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
  fetchStakeholders: (
    filters: {
      filterText?: string;
    },
    page: PageQuery,
    sortBy?: SortByQuery
  ) => void;
  fetchAllStakeholders: () => void;
}

export const useFetchStakeholders = (
  defaultIsFetching: boolean = false
): IState => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchStakeholders = useCallback(
    (
      filters: { filterText?: string },
      page: PageQuery,
      sortBy?: SortByQuery
    ) => {
      dispatch(fetchRequest());

      getStakeholders(filters, page, sortBy)
        .then(({ data }) => {
          const list = data._embedded.stakeholder;
          const total = data.total_count;

          dispatch(
            fetchSuccess({
              data: list,
              meta: {
                count: total,
              },
            })
          );
        })
        .catch((error: AxiosError) => {
          dispatch(fetchFailure(error));
        });
    },
    []
  );

  const fetchAllStakeholders = useCallback(() => {
    dispatch(fetchRequest());

    getAllStakeholders()
      .then(({ data }) => {
        const list = data._embedded.stakeholder;
        const total = data.total_count;

        dispatch(
          fetchSuccess({
            data: list,
            meta: {
              count: total,
            },
          })
        );
      })
      .catch((error: AxiosError) => {
        dispatch(fetchFailure(error));
      });
  }, []);

  return {
    stakeholders: state.stakeholders,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    fetchStakeholders,
    fetchAllStakeholders,
  };
};

export default useFetchStakeholders;