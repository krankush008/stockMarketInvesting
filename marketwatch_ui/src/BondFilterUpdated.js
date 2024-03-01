import React, { useState, useEffect, useMemo, useReducer } from 'react';
import axios from 'axios';
import './BondFilterUpdated.css';
import Alerts from './Alerts';

export const initialState = {
  allBonds: [],
  filters: [],
  maxMonthsRange: 12,
  selectedBonds: new Map(),
};

export const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ALL_BONDS':
      return { ...state, allBonds: action.payload };
    case 'SET_MAX_MONTHS_RANGE':
      return { ...state, maxMonthsRange: action.payload };
    case 'ADD_FILTER':
      return { ...state, filters: [...state.filters, action.payload] };
    case 'REMOVE_FILTER':
      return { ...state, filters: state.filters.filter((_, i) => i !== action.payload) };
    case 'UPDATE_FILTER':
      const updatedFilters = [...state.filters];
      updatedFilters[action.index][action.field] = action.value;
      return { ...state, filters: updatedFilters };
    case 'SET_SELECTED_BONDS':
      return { ...state, selectedBonds: action.payload };
    default:
      return state;
  }
};

const BondFilterUpdated = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { allBonds, filters, maxMonthsRange, selectedBonds } = state;

  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state

  const handelShowAlert = () => {
    setShowAlert(!showAlert);
  };
  useEffect(() => {
    const fetchAllBonds = async () => {
      try {
        const response = await axios.get(`https://fbe3-2401-4900-1cb8-83fa-d3e8-df4d-c883-eaec.ngrok-free.app/api/bonds`, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
            "ngrok-skip-browser-warning": "69420",
          }
        });

        console.log('response:', response);
        const filteredBonds = response.data.filter(bond => bond.isin !== '' && bond.maturityDate !== '' && bond.creditScore !== '');
        dispatch({ type: 'SET_ALL_BONDS', payload: filteredBonds });
        const maxMaturity = Math.max(...filteredBonds.map(bond => monthsToDisplay(bond.maturityDate)));
        dispatch({ type: 'SET_MAX_MONTHS_RANGE', payload: maxMaturity });
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.error('Error fetching all bonds data:', error);
      }
    };

    fetchAllBonds();
  }, []);

  const uniqueCreditScores = useMemo(() => [...new Set(allBonds.map(bond => bond.creditScore))], [allBonds]);
  const uniqueMonths = useMemo(() => Array.from({ length: maxMonthsRange }, (_, i) => i + 1), [maxMonthsRange]);

  const filterBonds = useMemo(() => (filters) => {
    return allBonds.filter(bond => {
      const creditScoreMatch = !filters.creditScore || bond.creditScore === filters.creditScore;
      const maturityMatch = !filters.maturity || monthsToDisplay(bond.maturityDate) <= filters.maturity;
      return creditScoreMatch && maturityMatch;
    });
  }, [allBonds]);

  const monthsToDisplay = (maturityDate) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const months = (maturity.getFullYear() - today.getFullYear()) * 12 + maturity.getMonth() - today.getMonth();
    return months;
  };

  const handleAddFilter = () => {
    dispatch({ type: 'ADD_FILTER', payload: { creditScore: '', maturity: '', threshold: '', bonds: [] } });
  };

  const handleRemoveFilter = (index) => {
    const updatedSelectedBonds = new Map(selectedBonds);
    filters[index].bonds.forEach(bond => updatedSelectedBonds.delete(bond.isin));
    dispatch({ type: 'SET_SELECTED_BONDS', payload: updatedSelectedBonds });
    dispatch({ type: 'REMOVE_FILTER', payload: index });
  };

  const handleFilterChange = (index, field, value) => {
    dispatch({ type: 'UPDATE_FILTER', index, field, value });
  };

  const applyFilters = (index) => {
    const filtered = filterBonds(filters[index]);
    dispatch({ type: 'UPDATE_FILTER', index, field: 'bonds', value: filtered });
  };

  const handleThresholdChange = (bond, threshold) => {
    if (threshold === '' && selectedBonds.has(bond.isin)) {
      dispatch({
        type: 'SET_SELECTED_BONDS',
        payload: new Map(selectedBonds).set(bond.isin, { bond, threshold: '' })
      });
    } else {
      dispatch({
        type: 'SET_SELECTED_BONDS',
        payload: new Map(selectedBonds).set(bond.isin, { bond, threshold: parseInt(threshold) })
      });
    }
  };

  const handleCheckboxChange = (bond) => {
    if (selectedBonds.has(bond.isin)) {
      const updatedSelectedBonds = new Map(selectedBonds);
      updatedSelectedBonds.delete(bond.isin);
      dispatch({ type: 'SET_SELECTED_BONDS', payload: updatedSelectedBonds });
    } else {
      dispatch({
        type: 'SET_SELECTED_BONDS',
        payload: new Map(selectedBonds).set(bond.isin, { bond, threshold: '' })
      });
    }
  };

  const handleSubmit = () => {
    const selectedBondsArray = Array.from(selectedBonds.values());
    console.log('Selected Bonds with Threshold:', selectedBondsArray);
    const invalidThreshold = selectedBondsArray.some(bond => bond.threshold === '');
    if (invalidThreshold) {
      alert('Please enter threshold for all selected bonds');
      return;
    }
    const alertsDataArray = selectedBondsArray.map(bond => ({
      bondId: bond.bond.isin,
      userId: 123,
      xirr: bond.threshold
    }));
    console.log('Alerts Data Array:', alertsDataArray);

    axios.put('http://localhost:8080/api/createAlerts', alertsDataArray)
      .then(response => {
        console.log('Alerts created successfully:', response.data);
      })
      .catch(error => {
        console.error('Error creating alerts:', error.message);
      });
  };

  return (
    <div className="bond-filter-container">
      <h2 className="page-title">Bond Filters</h2>

      {/* Show alert button */}
      <button
        className='show-alert-btn'
        onClick={
          () => setShowAlert(!showAlert)
        }
      >
        {showAlert ? 'Hide Alerts' : 'Show saved Alerts'}
      </button>
          <>
            <h2> Saved Alerts</h2>
            <Alerts
              selectedBonds={selectedBonds}
              dispatch={dispatch}
              allBonds={allBonds}
              showAlert={showAlert}
            />
          </>
      <button className="add-filter-btn" onClick={handleAddFilter}>Add Filter</button>
      {loading ? ( 
        <p>Loading...</p>
      ) : (
        <div>
        {filters.map((filter, index) => (
            <div key={index} className="filter-section">
              <div className="filter-inputs">
                <label className="filter-label">Credit Score:</label>
                <select
                  className="filter-select"
                  onChange={(e) => handleFilterChange(index, 'creditScore', e.target.value)}
                  value={filter.creditScore}
                >
                  <option value="">Select Credit Score</option>
                  {uniqueCreditScores.map((score, i) => (
                    <option key={i} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
                <label className="filter-label">Maturity:</label>
                <select
                  className="filter-select"
                  onChange={(e) => handleFilterChange(index, 'maturity', e.target.value)}
                  value={filter.maturity}
                >
                  <option value="">Select Maturity</option>
                  {uniqueMonths.map((month, i) => (
                    <option key={i} value={month}>
                      {month} months
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-buttons">
                <button className="apply-filter-btn" onClick={() => applyFilters(index)}>Apply Filters</button>
                <button className="remove-filter-btn" onClick={() => handleRemoveFilter(index)}>Remove</button>
              </div>
              <h3 className="filtered-bonds-title">Filtered Bonds:</h3>
              <ul className="filtered-bonds-list">

                {
                  (filter.bonds.length > 0) ? (
                    filter.bonds.map((bond, bondIndex) => (
                      <li key={bondIndex} className="bond-item">
                        <label className="bond-label">
                          <input
                            type="checkbox"
                            className="bond-checkbox"
                            onChange={() => handleCheckboxChange(bond)}
                            checked={selectedBonds.has(bond.isin)}
                          />
                          ID: {bond.isin}, Credit Score: {bond.creditScore}, Maturity: {bond.maturityDate}
                          {selectedBonds.has(bond.isin) && selectedBonds.get(bond.isin).threshold === '' && (
                            <span style={{ color: 'red', marginLeft: '10px' }}>Please enter threshold</span>
                          )}
                          Threshold:
                          <input
                            type="number"
                            className="threshold-input"
                            min="0"
                            value={selectedBonds.has(bond.isin) ? selectedBonds.get(bond.isin).threshold : ''}
                            onChange={(e) => handleThresholdChange(bond, e.target.value)}
                          />
                        </label>
                      </li>
                    ))
                  ) : (
                    <li>No bonds found</li>
                  )
                }
              </ul>
            </div>
          ))
        }
        </div>
      )}
        < button className="submit-btn" onClick={handleSubmit}>Submit</button>
    </div >
  );
};

export default BondFilterUpdated;