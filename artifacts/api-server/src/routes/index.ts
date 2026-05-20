import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import profileRouter from "./profile";
import memoryRouter from "./memory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(profileRouter);
router.use(memoryRouter);

export default router;
