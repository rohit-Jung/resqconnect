import { useThemeStore } from "../store/themeStore";

export const initializeApp = async () => {
	try {
		await useThemeStore.getState().initializeTheme();
	} catch (error) {
		console.log("Error initializing app:", error);
	}
};
