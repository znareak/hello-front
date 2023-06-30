import { useState } from 'react';
import { connectMetamask } from '../requests/metaRequests';
import { savePassword } from '../requests/clientRequests';
import { setPersonalSignature } from '../helpers/cipher';
import { baseUrl } from '../constants';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store';

import { setAddress, setLoading, setShowPasswordModal, setShowToast, setToastMessage, selectShowPasswordModal, setCustomToken } from '../features/counter/accountSlice';

const PasswordModal = (
) => {
	const dispatch = useDispatch<AppDispatch>();


	const showPasswordModal = useSelector(selectShowPasswordModal);
	const closePasswordModal = () => {
		dispatch(setShowPasswordModal(!showPasswordModal));
		dispatch(setLoading(false));
	};

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        validatePassword(e.target.value);
    };

    const validatePassword = (password: string) => {
        const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!pattern.test(password)) {
            setPasswordError('Password must include an uppercase letter, a number, 8 characters long and a special character');
        } else {
            setPasswordError('');
        }
    }

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };



    const handleWelcome = async () => {
        //create a get request with auth header "Bearer customToken" to /api
        const customToken = localStorage.getItem("customToken");
        if (!customToken) {
            return;
        }

        dispatch(setCustomToken(customToken));
        const response = await axios.get(`${baseUrl}/api/welcome`, {
            headers: {
                Authorization: `Bearer ${customToken}`,
            },
        });
        
        
        dispatch(setToastMessage(response.data.msg))
        dispatch(setShowToast(true));
    }

    const handleSubmit = async () => {
        if (!passwordError) {
            closePasswordModal();
            //alert the password
            const addressTemp: (string | Error) = await connectMetamask();
            if (addressTemp instanceof Error) {
                alert(addressTemp.message)
            } else {
                const response = await savePassword(password);

                //check if the response is an error
                if (response instanceof Error) {
                    //extend response so it response.response.data exists
                    const error = response as Error;
                    //remove customToken from localStorage
                    localStorage.removeItem("customToken");
                    sessionStorage.removeItem("personalSignature");
                    //setLoading to false
                    dispatch(setLoading(false));
                    //set toast message to error.response.data
                    dispatch(setToastMessage(error));
                    //show toast
                    dispatch(setShowToast(true));
                    return;
                }


                await setPersonalSignature(addressTemp, password);





                await handleWelcome();
                dispatch(setAddress(addressTemp));
                dispatch(setLoading(false));
            }
        }
    }

    return (
        <>
            <div style={{ display: showPasswordModal ? "block" : "none" }} className="modal-backdrop show"></div>
            <div style={{ display: showPasswordModal ? "block" : "none" }} className="modal show fade" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Account password</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={closePasswordModal} aria-label="Closx"></button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <input type={showPassword ? "text" : "password"} className={`form-control ${passwordError ? 'is-invalid' : ''}`} value={password} onChange={handlePasswordChange} />
                                <button className="btn btn-outline-secondary" type="button" onClick={togglePassword}>{showPassword ? "Hide" : "Show"}</button>
                                {passwordError && <div className="invalid-feedback">{passwordError}</div>}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closePasswordModal} data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Sign in</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PasswordModal;