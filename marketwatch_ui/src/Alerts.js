import React, { useEffect, useState  , useReducer} from 'react'
import axios from 'axios'
import { initialState ,  reducer } from './BondFilterUpdated';
const Alerts = ({ allBonds, selectedBonds, dispatch }) => {
    const [yourBonds, setYourBonds] = useState([]);
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
    useEffect(() => {
        const fetchYourBonds = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/getAlertsByUserId/${124}`);
                const responseBonds = response.data.map(bond => ({
                    isin: bond.bondId,
                    xirr: bond.xirr
                }));
                console.log('responseBonds:', responseBonds);
                const yourBonds = allBonds.filter(bond => {
                    return responseBonds.some(responseBond => responseBond.isin === bond.isin);
                }).map(filteredBond => ({
                    ...filteredBond,
                    xirr: responseBonds.find(responseBond => responseBond.isin === filteredBond.isin).xirr
                }));
                console.log('yourBonds:', yourBonds)
                const selectedBonds = yourBonds.map(bond => {
                    return {
                        "bond": {
                            "isin": bond.isin,
                            "creditScore": bond.creditScore,
                            "maturityDate": bond.maturityDate
                        },
                        "threshold": bond.xirr
                    }

                
                }
                );
            
                const selectedBondsMap = new Map();
                selectedBonds.forEach(bond => {
                    selectedBondsMap.set(bond.bond.isin, bond);
                });


                dispatch({ type: 'SET_SELECTED_BONDS', payload: selectedBondsMap});
                setYourBonds(selectedBonds);
                console.log('selectedBonds:', selectedBonds);
            } catch (error) {
                console.error('Error fetching all bonds data:', error);
            }
        }
        fetchYourBonds();
    }, [allBonds]);




    
    return (
        <ul className="filtered-bonds-list">
            {
                yourBonds.map((bond , bondIndex) => {
                    return (
                        <li key={bond.bond.isin}>
                            <input
                type="checkbox"
                className="bond-checkbox"
                checked={selectedBonds.has(bond.bond.isin)}
                onChange={()=>{handleCheckboxChange(bond.bond)}}
                />
                            ID:{bond.bond.isin} , Credit Score:{bond.bond.creditScore} , Maturity: {bond.bond.maturityDate}
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
                        </li>
                    )
                })
            }
        </ul>
    )
}

export default Alerts