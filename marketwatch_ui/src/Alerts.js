import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Alerts = ({ allBonds = [], selectedBonds, dispatch, showAlert }) => {
  const [yourBonds, setYourBonds] = useState([]);
  console.log('selectedBonds', selectedBonds);
  console.log('yourBonds', yourBonds);

  useEffect(() => {
    const fetchYourBonds = async () => {
      try {

        const response = await axios.get(`https://fbe3-2401-4900-1cb8-83fa-d3e8-df4d-c883-eaec.ngrok-free.app/api/getAlertsByUserId/${124}`, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
          }
        });
        const responseBonds = response.data.map(bond => ({
          isin: bond.bondId,
          xirr: bond.xirr
        }));
        const yourBonds = await allBonds.filter(bond => {
          return responseBonds.some(responseBond => responseBond.isin === bond.isin);
        }).map(filteredBond => ({
          ...filteredBond,
          xirr: responseBonds.find(responseBond => responseBond.isin === filteredBond.isin).xirr
        }));

        const selectedBonds = yourBonds.map(bond => ({
          "bond": {
            "isin": bond.isin,
            "creditScore": bond.creditScore,
            "maturityDate": bond.maturityDate
          },
          "threshold": bond.xirr
        }));

        const selectedBondsMap = new Map();
        selectedBonds.forEach(bond => {
          selectedBondsMap.set(bond.bond.isin, bond);
        });

        dispatch({ type: 'SET_SELECTED_BONDS', payload: selectedBondsMap });
        setYourBonds(selectedBonds);

      } catch (error) {
        console.error('Error fetching all bonds data:', error);
      }
    };
    fetchYourBonds();
  }, [allBonds, dispatch]);

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

  return (
    <div>

      <ul className="filtered-bonds-list">
        {yourBonds.map((bond, bondIndex) => (
          <li key={bond.bond.isin}>
            {
              showAlert ? (
                <>
                <input
                  type="checkbox"
                  className="bond-checkbox"
                  checked={selectedBonds.has(bond.bond.isin)}
                  onChange={() => handleCheckboxChange(bond.bond)}
                />
               ID: {bond.bond.isin}, Credit Score: {bond.bond.creditScore}, Maturity: {bond.bond.maturityDate}
            {selectedBonds.has(bond.bond.isin) && selectedBonds.get(bond.bond.isin).threshold === '' && (
              <span style={{ color: 'red', marginLeft: '10px' }}>Please enter threshold</span>
            )}
            Threshold:
            <input
              type="number"
              className="threshold-input"
              min="0"
              value={selectedBonds.has(bond.bond.isin) ? selectedBonds.get(bond.bond.isin).threshold : ''}
              onChange={(e) => handleThresholdChange(bond.bond, e.target.value)}
            />
</>
            )
            :(
            <div>
             
            </div>
            )
}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Alerts;
