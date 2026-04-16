import { _decorator, CCFloat, CCInteger, Color, Component, director, instantiate, macro, Node, Prefab, Vec3 } from 'cc';
import { Spool } from './Spool';
import { ServiceLocator } from '../ServiceLocator';
import { GameConfig } from './GameConfigSA';
import { GameManager, GameState } from './GameManager';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import { RopeBezierWave3D } from '../../Deps/iKame/scripts/rope/RopeBezierWave3D';
import { NavigationContainer } from '../Navigation/NavigationContainer';
import { TutorialController } from './UI/TutorialController';
import { SoundManager } from '../SoundManager';
import { WoolManager } from './WoolManager';
import { SOUNDS } from './Sounds';
import { SlotManager } from './SlotManager';
import { print } from '../ultils';
const { ccclass, property } = _decorator;

@ccclass('SpoolManager')
export class SpoolManager extends Component {


    @property(CCFloat)
    public spacing: number

    @property({ type: Spool })
    public spools: Spool[] = []

    public spoolsMap: Map<string, Spool> = new Map<string, Spool>()

    // @property(Prefab)
    // public ropePrefab: Prefab
    @property({ type: RopeBezierWave3D })
    public ropes: RopeBezierWave3D[] = []


    protected gameManager: GameManager = null

    protected onLoad(): void {
        ServiceLocator.register(SpoolManager, this)
    }

    protected start(): void {
        this.gameManager = ServiceLocator.get(GameManager);
        this.spawnGrid();
    }


    public getSpool(row: number, col: number): Spool | undefined {
        return this.spoolsMap.get(`${row}_${col}`)
    }

    private spawnGrid() {
        this.spools = [];

        const gameConfig = ServiceLocator.get(GameConfig);
        const newLevelData = this.gameManager.newLevelData;


        const columns = newLevelData.gridWidth;
        const rows = newLevelData.gridHeight;

        const totalWidth = (columns - 1) * this.spacing;
        const totalDepth = (rows - 1) * this.spacing;

        const startX = -totalWidth / 2;
        const startZ = -totalDepth / 2;

        for (const vehicle of newLevelData.vehiclesData) {

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
            node.setParent(this.node);

            // Set color from colorMap
            spool.color = this.gameManager.getLevelColor(vehicle.entityColorType) || Color.WHITE;

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

    public remove(spool: Spool) {
        const index = this.spools.indexOf(spool)
        if (index >= 0) {
            this.spools.splice(index, 1)
        }
        this.spoolsMap.delete(`${spool.row}_${spool.col}`)
    }

    public checkWin() {
        if(this.gameManager.state !== GameState.PLAY) return
        if (this.spools.length == 0) {
            console.log('win');
            this.gameManager.state = GameState.WIN
            SoundManager.instance.playOneShot(SOUNDS.WIN)
            // const confetiEffect = instantiate(ServiceLocator.get(GameConfig).confettiEffect)
            // const scene = director.getScene();
            // confetiEffect.setParent(scene)

            EventBus.emit(GameEvent.LEVEL_COMPLETED)
        }
        else {
            const speedMultiplier: number = 1.025;
        // Tăng tốc độ theo phần trăm mỗi khi hoàn thành 1 spool
        const woolManager = ServiceLocator.get(WoolManager);
        
        // Công thức: Tốc độ mới = Tốc độ cũ * 1.1 (hoặc tùy biến)
        const newSpeed = woolManager.speed * speedMultiplier;
        
        // Bạn nên giới hạn tốc độ tối đa để tránh lỗi vật lý hoặc giật lag
        const MAX_SPEED = 10; 
        woolManager.speed = Math.min(newSpeed, MAX_SPEED);
        
        console.log(`Speed increased to: ${woolManager.speed.toFixed(2)}`);
    }
    }

    public onSpoolSelected(spool: Spool) {

        if (Spool.delay) return
        if (spool.isFlying || spool.isInSlot) return;
        if (!spool.isOpen) {
            SoundManager.instance.playOneShot(SOUNDS.FAILED);
            return;
        }


        // const tut = ServiceLocator.get(TutorialController)
        // if (tut && tut.node.active) {
        //     tut.node.active = false
        // }

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

        // Kiểm tra nếu còn slot trống
        const availableSlot = slotManager.getAvailableSlot();
        if (availableSlot) {
            return; // Còn slot trống, chưa thua
        }

        // Nếu không còn slot trống, kiểm tra xem có RaySlot nào trùng màu với spool trong slot
        for (const raySlot of woolManager.slots) {
            if (!raySlot.wool) continue;
            for (const slot of slotManager.slots) {
                if (slot.spool && raySlot.wool.color.equals(slot.spool.color)) {
                    return; // Có RaySlot trùng màu, chưa thua
                }
            }
        }

        // Không có RaySlot trùng màu, thua
        console.log('Lose');
        this.gameManager.state = GameState.LOSE
        // SoundManager.instance.playOneShot(SOUNDS.LOSE)
        EventBus.emit(GameEvent.LEVEL_COMPLETED)
    }

}
