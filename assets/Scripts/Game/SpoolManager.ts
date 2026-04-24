import { _decorator, CCFloat, CCInteger, Color, Component, director, instantiate, macro, Node, Prefab, Vec3 } from 'cc';
import { Spool } from './Spool';
import { ServiceLocator } from '../ServiceLocator';
import { GameConfig } from './GameConfigSA';
import { GameManager, GameState } from './GameManager';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import { TutorialController } from './UI/TutorialController';
import { SoundManager } from '../SoundManager';
import { WoolManager } from './WoolManager';
import { SOUNDS } from './Sounds';
import { SlotManager } from './SlotManager';
import { print } from '../ultils';
import { NewLevelData } from './NewLevelDataSA';
import { MatchZone } from './MatchZone';
import { ETrackingEvent, TrackingManager } from '../TrackingManager';
const { ccclass, property } = _decorator;

@ccclass('SpoolManager')
export class SpoolManager extends Component {


    @property(CCFloat)
    public spacing: number

    @property(Node) public spoolContainer: Node = null

    @property({ type: Spool })
    public spools: Spool[] = []

    public spoolsMap: Map<string, Spool> = new Map<string, Spool>()


    protected gameManager: GameManager = null


    public progress = 0
    public total = 0
    progressTracked = {
        quarter: false,  // 25%
        half: false,     // 50%
        threeQuarter: false  // 75%
    }


    protected onLoad(): void {
        ServiceLocator.register(SpoolManager, this)
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.COLLECT_DONE, this.onCollectDone)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.COLLECT_DONE, this.onCollectDone)
    }
    protected start(): void {
        this.gameManager = ServiceLocator.get(GameManager);
    }

    onCollectDone = () => {
        this.progress++

        const percentage = (this.progress / this.total) * 100
        console.log("progress " + percentage)

        if (!this.progressTracked.quarter && percentage >= 25) {
            this.progressTracked.quarter = true
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_25)
        }

        if (!this.progressTracked.half && percentage >= 50) {
            this.progressTracked.half = true
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_50)
        }

        if (!this.progressTracked.threeQuarter && percentage >= 75) {
            this.progressTracked.threeQuarter = true
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_75)
        }
        this.checkWin()
    }


    public init(levelData: NewLevelData) {
        const gameConfig = ServiceLocator.get(GameConfig);
        const columns = levelData.gridWidth;
        const rows = levelData.gridHeight;

        const totalWidth = (columns - 1) * this.spacing;
        const totalDepth = (rows - 1) * this.spacing;

        const startX = -totalWidth / 2;
        const startZ = -totalDepth / 2;
        this.total = levelData.vehiclesData.length

        for (const vehicle of levelData.vehiclesData) {

            const col = vehicle.coordinateX;
            const row = vehicle.coordinateY;

            const node = instantiate(gameConfig.spoolPrefab);
            const spool = node.getComponent(Spool);

            if (!spool) {
                node.removeFromParent();
                continue;
            }
            spool.row = row;
            spool.col = col;
            node.name = `Spool_(${row}, ${col})`;
            if (this.spoolContainer) {
                node.setParent(this.spoolContainer);
            }
            else {
                node.setParent(this.node);
            }

            // Set color from colorMap
            spool.color = levelData.getColor(vehicle.entityColorType) || Color.WHITE;

            const x = startX + col * this.spacing;
            const z = startZ + row * this.spacing;

            node.setPosition(new Vec3(x, 0, z));

            spool.clickFunc = () => {
                this.onSpoolSelected(spool)
            }

            this.spools.push(spool);
            this.spoolsMap.set(`${row}_${col}`, spool);

        }
    }

    public getSpool(row: number, col: number): Spool | undefined {
        return this.spoolsMap.get(`${row}_${col}`)
    }

    public remove(spool: Spool) {
        const index = this.spools.indexOf(spool)
        if (index >= 0) {
            this.spools.splice(index, 1)
        }
        this.spoolsMap.delete(`${spool.row}_${spool.col}`)
    }

    public checkWin() {
        if (this.gameManager.state !== GameState.PLAY) return
        if (this.spools.length == 0) {
            console.log('win');
            this.gameManager.state = GameState.WIN
            SoundManager.instance.playOneShot(SOUNDS.WIN)
            const confetiEffect = instantiate(ServiceLocator.get(GameConfig).confettiEffect)
            const scene = director.getScene();
            confetiEffect.setParent(scene)

            EventBus.emit(GameEvent.LEVEL_COMPLETED)
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_SOLVED)
        }
    }

    public onSpoolSelected(spool: Spool) {

        if (Spool.delay) return
        if (spool.isFlying || spool.isInSlot) return;
        if (!spool.isOpen) {
            SoundManager.instance.playOneShot(SOUNDS.FAILED);
            return;
        }

        const tut = ServiceLocator.get(TutorialController)
        if (tut && tut.node.active) {
            tut.node.active = false
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_STARTED)
        }

        const slot = ServiceLocator.get(SlotManager).getAvailableSlot();

        if (!slot) {
            SoundManager.instance.playOneShot('Failed');
            console.log('out of slot');
            return;
        }
        Spool.delay = true

        spool.activateNextSpools();
        SoundManager.instance.playOneShot(SOUNDS.CLICK);
        spool.moveToSlot(slot, () => {
            print("Move DONE")

            this.checkLose();
        });
    }

    public checkLose() {
        const slotManager = ServiceLocator.get(SlotManager);
        const woolManager = ServiceLocator.get(WoolManager);
        const matchZone = ServiceLocator.get(MatchZone);

        // 1. Nếu vẫn còn slot trống thì chưa thể thua
        const availableSlot = slotManager.getAvailableSlot();
        if (availableSlot) return;


        // 2. Kiểm tra xem có bất kỳ Spool nào trong Slot đang bận hút len không
        // Nếu có Spool đang collects(), ta phải đợi nó hút xong mới biết được có thua hay không
        for (const slot of slotManager.slots) {
            if (slot.spool && slot.spool.isCollecting) {
                return;
            }
        }

        // 3. Kiểm tra xem trên sân (Băng chuyền + MatchZone) còn cục len nào 
        // có màu trùng với các Spool đang đợi trong Slot hay không
        let hasMatchableWool = false;

        // Gom tất cả len đang có trên sân
        const allWoolsOnField = woolManager.slots.filter(s => s.wool);

        for (const slot of slotManager.slots) {
            const spool = slot.spool;
            if (!spool) continue;

            // Tìm xem còn cục len nào cùng màu với spool này không
            const match = allWoolsOnField.find(ws => ws.wool.color.equals(spool.color));
            if (match) {
                hasMatchableWool = true;
                break;
            }
        }

        // 4. Nếu full slot VÀ không còn Spool nào đang thu dây VÀ không còn len cùng màu trên sân
        if (!hasMatchableWool) {
            console.log('Lose: No more wools to collect and all slots are full');
            this.gameManager.state = GameState.LOSE;
            // EventBus.emit(GameEvent.LEVEL_COMPLETED);
            EventBus.emit(GameEvent.LEVEL_FAILED)

        }
    }

}
