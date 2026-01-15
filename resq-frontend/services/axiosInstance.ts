import axios from "axios";

const routerVersion = `v1`;

const api = axios.create({
	baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/${routerVersion}`,
	withCredentials: true,
});

export default api;
