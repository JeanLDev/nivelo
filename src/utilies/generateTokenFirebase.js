import { getToken } from "firebase/messaging";
import { messaging } from "../lib/firebase";
import storage from "./storage";



export async function generateToken() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Permissão negada");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: "BLtsYK7GOlUCFoBNBgCh8vSBvUsvAsPTk_WoxILc8NHrLOUTkel2D9nu6jaAxSEJTuk9rmUlIV353kHuH1GUB54"
    });

    if (token) {
      //await storage.saveToken(token)
    }

  } catch (err) {
    console.error(err);
  }
}