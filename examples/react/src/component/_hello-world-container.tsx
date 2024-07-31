import { useNavigate } from "react-router-dom";

const HelloWorldContainer = () => {
    const navigate = useNavigate();

    return (
        <>
            <h1>Hello world!</h1>
            <ul className="horizontal">
                <li>
                    <button
                        onClick={() => {
                            window.history.go(-1);
                        }}>
                        To previous page
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => {
                            navigate(-1);
                        }}>
                        To previous page
                    </button>
                </li>
            </ul>
        </>
    );
};

export default HelloWorldContainer;
