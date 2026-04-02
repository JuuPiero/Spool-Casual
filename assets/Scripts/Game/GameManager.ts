import { _decorator, Component, Node, sys } from 'cc';
import { GameConfig } from './GameConfigSA';
import { ServiceLocator } from '../ServiceLocator';
import { LevelData } from './LevelData';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import super_html_playable from '../super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(GameConfig)
    public gameConfig: GameConfig;

    @property(LevelData)
    public currentLevelData: LevelData


    @property(Node) tutorial: Node = null

    @property tutIndex: number = 0


    protected onLoad(): void {
        if(this.gameConfig) {
            ServiceLocator.register(GameConfig, this.gameConfig)
            ServiceLocator.register(GameManager, this)
        }
        super_html_playable.set_google_play_url(this.gameConfig.storeUrl)

        EventBus.on(GameEvent.LEVEL_COMPLETED, this.installGame)
    }

    protected start(): void {
        
    }

    installGame = () => {
        super_html_playable.download()
        // sys.openURL(this.gameConfig.storeUrl)
        // ServiceLocator.get(NavigationContainer).stack.navigate('EndgameScreen')
    }
}
