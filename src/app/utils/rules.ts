import { Injectable } from '@angular/core';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { TiledeskRequestsService } from 'src/chat21-core/providers/tiledesk/tiledesk-requests.service';
import { getDateDifference } from 'src/chat21-core/utils/utils';
import { Rule } from 'src/models/rule';
import { UserModel } from './../../chat21-core/models/user';
import { Globals } from './globals';


@Injectable({
    providedIn: 'root'
})
export class Rules {

    private windowContext:Window = window
    private tiledeskToken: string;
    private currentUser: UserModel;
    private request_id: string;
    private rules: Rule[]
    private logger: LoggerService = LoggerInstance.getInstance()
    constructor(
        private tiledeskRequestsService: TiledeskRequestsService,
        private appStorageService: AppStorageService,
        private g: Globals
    ){}


    initRules(context: Window, tiledeskToken: string, currentUser: UserModel, request_id: string, rules:Rule[]){
        this.logger.info('[RULES] initRules',context, currentUser, rules)
        this.windowContext = context
        this.tiledeskToken = tiledeskToken
        this.currentUser = currentUser
        this.request_id = request_id
        this.rules = rules
        this.checkRules()
    }

    checkRules(){
        let exit = false;
        this.rules.forEach((rule, index)=>{
            if(!exit && rule.when && new RegExp(rule.when.urlMatches).test(this.windowContext.location.href)){
                if(this.checkIfAlreadyDone(rule)){
                    this.doAction(rule.do)
                    exit = true
                    return;
                }
                
            }
        })
    }

    private doAction(action: Rule['do']){
        this.logger.info('[RULES] doAction', this.request_id, this.currentUser, action)
        let message = action.filter(obj => Object.keys(obj).includes('message'))
        if(message && message.length>0){
            message[0]['message'].attributes = { ...this.g.attributes, ...message[0]['message'].attributes}
            message[0]['message'].userAgent = this.g.attributes['client']
            message[0]['message'].request_id = this.request_id
            message[0]['message'].sourcePage = this.g.attributes['sourcePage']
            message[0]['message'].language = this.g.lang
            message[0]['message'].departmentid = this.g.attributes.departmentId
            this.tiledeskRequestsService.sendMessageToRequest(this.request_id, this.tiledeskToken, message[0]['message'])
        }
    }


    private checkIfAlreadyDone(rule: Rule): boolean{
        let storedRules = JSON.parse(this.appStorageService.getItem('_rules')) || {}
        let canHandleAction: boolean = false
        if(storedRules && storedRules.hasOwnProperty(rule.uid)){
            let timeDifference = getDateDifference(storedRules[rule.uid], Date.now())
            if(timeDifference.hours > rule.when.triggerEvery){
                storedRules[rule.uid]= Date.now()
                canHandleAction = true
            }else{
                canHandleAction = false
            }
        }else{
            canHandleAction = true
            storedRules[rule.uid]= Date.now()
            
        }
        this.appStorageService.setItem('_rules', JSON.stringify(storedRules))
        return canHandleAction
    }




}
