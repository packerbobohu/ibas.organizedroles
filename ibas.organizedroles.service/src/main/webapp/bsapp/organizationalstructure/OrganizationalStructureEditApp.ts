/**
 * @license
 * Copyright color-coding studio. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0
 * that can be found in the LICENSE file at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as ibas from "ibas/index";
import * as bo from "../../borep/bo/index";
import * as ia from "../../3rdparty/initialfantasy/index";
import { BORepositoryOrganizedRoles } from "../../borep/BORepositories";

/** 应用-组织-结构 */
export class OrganizationalStructureEditApp extends ibas.BOEditApplication<IOrganizationalStructureEditView, bo.OrganizationalStructure> {

    /** 应用标识 */
    static APPLICATION_ID: string = "2f18a84b-3756-429d-bc2c-607d5e633e21";
    /** 应用名称 */
    static APPLICATION_NAME: string = "initialfantasy_app_organizationalstructure_edit";
    /** 业务对象编码 */
    static BUSINESS_OBJECT_CODE: string = bo.OrganizationalStructure.BUSINESS_OBJECT_CODE;
    /** 构造函数 */
    constructor() {
        super();
        this.id = OrganizationalStructureEditApp.APPLICATION_ID;
        this.name = OrganizationalStructureEditApp.APPLICATION_NAME;
        this.boCode = OrganizationalStructureEditApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
    }
    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.deleteDataEvent = this.deleteData;
        this.view.createDataEvent = this.createData;
        this.view.chooseManagerEvent = this.chooseManager;
        this.view.chooseOrganizationalStructureEvent = this.chooseOrganizationalStructure;
        this.view.chooseOrganizationEvent = this.chooseOrganization;
        this.view.addOrganizationalRoleEvent = this.addOrganizationalRole;
        this.view.removeOrganizationalRoleEvent = this.removeOrganizationalRole;
        this.view.chooseOrganizationalRoleEvent = this.chooseOrganizationalRole;
        this.view.selectedOrganizationalRoleEvent = this.selectedOrganizationalRole;
        this.view.addRoleMemberEvent = this.addRoleMember;
        this.view.removeRoleMemberEvent = this.removeRoleMember;
        this.view.choooseRoleMemberEvent = this.choooseRoleMember;
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
        if (ibas.objects.isNull(this.editData)) {
            // 创建编辑对象实例
            this.editData = new bo.OrganizationalStructure();
            this.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_data_created_new"));
        }
        this.view.showOrganizationalStructure(this.editData);
        this.view.showOrganizationalRoles(this.editData.organizationalRoles.filterDeleted());
    }
    /** 运行,覆盖原方法 */
    run(...args: any[]): void {
        let that: this = this;
        if (ibas.objects.instanceOf(arguments[0], bo.OrganizationalStructure)) {
            // 尝试重新查询编辑对象
            let criteria: ibas.ICriteria = arguments[0].criteria();
            if (!ibas.objects.isNull(criteria) && criteria.conditions.length > 0) {
                // 有效的查询对象查询
                let boRepository: BORepositoryOrganizedRoles = new BORepositoryOrganizedRoles();
                boRepository.fetchOrganizationalStructure({
                    criteria: criteria,
                    onCompleted(opRslt: ibas.IOperationResult<bo.OrganizationalStructure>): void {
                        let data: bo.OrganizationalStructure;
                        if (opRslt.resultCode === 0) {
                            data = opRslt.resultObjects.firstOrDefault();
                        }
                        if (ibas.objects.instanceOf(data, bo.OrganizationalStructure)) {
                            // 查询到了有效数据
                            that.editData = data;
                            that.show();
                        } else {
                            // 数据重新检索无效
                            that.messages({
                                type: ibas.emMessageType.WARNING,
                                message: ibas.i18n.prop("shell_data_deleted_and_created"),
                                onCompleted(): void {
                                    that.show();
                                }
                            });
                        }
                    }
                });
                // 开始查询数据
                return;
            }
        }
        super.run();
    }
    /** 待编辑的数据 */
    protected editData: bo.OrganizationalStructure;
    /** 保存数据 */
    protected saveData(): void {
        let that: this = this;
        let boRepository: BORepositoryOrganizedRoles = new BORepositoryOrganizedRoles();
        boRepository.saveOrganizationalStructure({
            beSaved: this.editData,
            onCompleted(opRslt: ibas.IOperationResult<bo.OrganizationalStructure>): void {
                try {
                    that.busy(false);
                    if (opRslt.resultCode !== 0) {
                        throw new Error(opRslt.message);
                    }
                    if (opRslt.resultObjects.length === 0) {
                        // 删除成功，释放当前对象
                        that.messages(ibas.emMessageType.SUCCESS,
                            ibas.i18n.prop("shell_data_delete") + ibas.i18n.prop("shell_sucessful"));
                        that.editData = undefined;
                    } else {
                        // 替换编辑对象
                        that.editData = opRslt.resultObjects.firstOrDefault();
                        that.messages(ibas.emMessageType.SUCCESS,
                            ibas.i18n.prop("shell_data_save") + ibas.i18n.prop("shell_sucessful"));
                    }
                    // 刷新当前视图
                    that.viewShowed();
                } catch (error) {
                    that.messages(error);
                }
            }
        });
        this.busy(true);
        this.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("shell_saving_data"));
    }
    /** 删除数据 */
    protected deleteData(): void {
        let that: this = this;
        this.messages({
            type: ibas.emMessageType.QUESTION,
            title: ibas.i18n.prop(this.name),
            message: ibas.i18n.prop("sys_whether_to_delete"),
            actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
            onCompleted(action: ibas.emMessageAction): void {
                if (action === ibas.emMessageAction.YES) {
                    that.editData.delete();
                    that.saveData();
                }
            }
        });
    }
    /** 新建数据，参数1：是否克隆 */
    protected createData(clone: boolean): void {
        let that: this = this;
        let createData: Function = function (): void {
            if (clone) {
                // 克隆对象
                that.editData = that.editData.clone();
                that.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_data_cloned_new"));
                that.viewShowed();
            } else {
                // 新建对象
                that.editData = new bo.OrganizationalStructure();
                that.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_data_created_new"));
                that.viewShowed();
            }
        };
        if (that.editData.isDirty) {
            this.messages({
                type: ibas.emMessageType.QUESTION,
                title: ibas.i18n.prop(this.name),
                message: ibas.i18n.prop("sys_data_not_saved_whether_to_continue"),
                actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
                onCompleted(action: ibas.emMessageAction): void {
                    if (action === ibas.emMessageAction.YES) {
                        createData();
                    }
                }
            });
        } else {
            createData();
        }
    }
    /** 添加组织-角色事件 */
    addOrganizationalRole(): void {
        this.editData.organizationalRoles.create();
        // 仅显示没有标记删除的
        this.view.showOrganizationalRoles(this.editData.organizationalRoles.filterDeleted());
    }
    /** 删除组织-角色事件 */
    removeOrganizationalRole(items: bo.OrganizationalRole[]): void {
        // 非数组，转为数组
        if (!(items instanceof Array)) {
            items = [items];
        }
        if (items.length === 0) {
            return;
        }
        // 移除项目
        for (let item of items) {
            if (this.editData.organizationalRoles.indexOf(item) >= 0) {
                if (item.isNew) {
                    // 新建的移除集合
                    this.editData.organizationalRoles.remove(item);
                } else {
                    // 非新建标记删除
                    item.delete();
                }
            }
        }
        // 仅显示没有标记删除的
        this.view.showOrganizationalRoles(this.editData.organizationalRoles.filterDeleted());
    }
    /** 选则-组织 */
    chooseOrganization(): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<ia.IOrganization>({
            boCode: ia.BO_CODE_ORGANIZATION,
            criteria: [
                new ibas.Condition("activated", ibas.emConditionOperation.EQUAL, "Y")
            ],
            onCompleted(selecteds: ibas.List<ia.IOrganization>): void {
                that.editData.organization = selecteds.firstOrDefault().code;
            }
        });
    }
    /** 选则-所属组织 */
    chooseOrganizationalStructure(): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<bo.OrganizationalStructure>({
            boCode: bo.OrganizationalStructure.BUSINESS_OBJECT_CODE,
            criteria: [
                new ibas.Condition(
                    bo.OrganizationalStructure.PROPERTY_OBJECTKEY_NAME,
                    ibas.emConditionOperation.NOT_EQUAL,
                    this.editData.objectKey
                )
            ],
            onCompleted(selecteds: ibas.List<bo.OrganizationalStructure>): void {
                that.editData.belonging = selecteds.firstOrDefault().objectKey;
            }
        });
    }
    /** 选则-经理 */
    chooseManager(): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<ia.IUser>({
            boCode: ia.BO_CODE_USER,
            criteria: [
                new ibas.Condition("activated", ibas.emConditionOperation.EQUAL, "Y")
            ],
            onCompleted(selecteds: ibas.List<ia.IUser>): void {
                that.editData.manager = selecteds.firstOrDefault().code;
            }
        });
    }
    /** 选则-组织角色 */
    chooseOrganizationalRole(caller: bo.OrganizationalRole): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<bo.Role>({
            caller: caller,
            boCode: bo.Role.BUSINESS_OBJECT_CODE,
            criteria: [
                new ibas.Condition(bo.Role.PROPERTY_ACTIVATED_NAME, ibas.emConditionOperation.EQUAL, "Y")
            ],
            onCompleted(selecteds: ibas.List<bo.Role>): void {
                // 获取触发的对象
                let index: number = that.editData.organizationalRoles.indexOf(caller);
                let item: bo.OrganizationalRole = that.editData.organizationalRoles[index];
                // 选择返回数量多余触发数量时,自动创建新的项目
                let created: boolean = false;
                for (let selected of selecteds) {
                    if (ibas.objects.isNull(item)) {
                        item = that.editData.organizationalRoles.create();
                        created = true;
                    }
                    item.role = selected.code;
                    item = null;
                }
                if (created) {
                    // 创建了新的行项目
                    that.view.showOrganizationalRoles(that.editData.organizationalRoles.filterDeleted());
                }
            }
        });
    }
    private editOrganizationalRole: bo.OrganizationalRole;
    selectedOrganizationalRole(orgRole: bo.OrganizationalRole): void {
        if (ibas.objects.isNull(orgRole)) {
            this.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_please_chooose_data",
                ibas.i18n.prop("shell_data_edit")
            ));
            return;
        }
        this.editOrganizationalRole = orgRole;
        // 仅显示没有标记删除的
        this.view.showRoleMembers(this.editOrganizationalRole.roleMembers.filterDeleted());
    }
    /** 添加角色-成员事件 */
    addRoleMember(): void {
        if (ibas.objects.isNull(this.editOrganizationalRole)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_please_chooose_data",
                ibas.i18n.prop("shell_data_edit")
            ));
            return;
        }
        this.editOrganizationalRole.roleMembers.create();
        // 仅显示没有标记删除的
        this.view.showRoleMembers(this.editOrganizationalRole.roleMembers.filterDeleted());
    }
    /** 删除角色-成员事件 */
    removeRoleMember(items: bo.RoleMember[]): void {
        if (ibas.objects.isNull(this.editOrganizationalRole)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_please_chooose_data",
                ibas.i18n.prop("shell_data_edit")
            ));
            return;
        }
        // 非数组，转为数组
        if (!(items instanceof Array)) {
            items = [items];
        }
        if (items.length === 0) {
            return;
        }
        // 移除项目
        for (let item of items) {
            if (this.editOrganizationalRole.roleMembers.indexOf(item) >= 0) {
                if (item.isNew) {
                    // 新建的移除集合
                    this.editOrganizationalRole.roleMembers.remove(item);
                } else {
                    // 非新建标记删除
                    item.delete();
                }
            }
        }
        // 仅显示没有标记删除的
        this.view.showRoleMembers(this.editOrganizationalRole.roleMembers.filterDeleted());
    }
    /** 选择-角色成员 */
    choooseRoleMember(caller: bo.RoleMember): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<ia.IUser>({
            caller: caller,
            boCode: ia.BO_CODE_USER,
            criteria: [
                new ibas.Condition("activated", ibas.emConditionOperation.EQUAL, "Y")
            ],
            onCompleted(selecteds: ibas.List<ia.IUser>): void {
                // 获取触发的对象
                if (ibas.objects.isNull(that.editOrganizationalRole)) {
                    return;
                }
                let index: number = that.editOrganizationalRole.roleMembers.indexOf(caller);
                let item: bo.RoleMember = that.editOrganizationalRole.roleMembers[index];
                // 选择返回数量多余触发数量时,自动创建新的项目
                let created: boolean = false;
                for (let selected of selecteds) {
                    if (ibas.objects.isNull(item)) {
                        item = that.editOrganizationalRole.roleMembers.create();
                        created = true;
                    }
                    item.member = selected.code;
                    item = null;
                }
                if (created) {
                    // 创建了新的行项目
                    that.view.showRoleMembers(that.editOrganizationalRole.roleMembers.filterDeleted());
                }
            }
        });
    }

}
/** 视图-组织-结构 */
export interface IOrganizationalStructureEditView extends ibas.IBOEditView {
    /** 显示数据 */
    showOrganizationalStructure(data: bo.OrganizationalStructure): void;
    /** 删除数据事件 */
    deleteDataEvent: Function;
    /** 新建数据事件，参数1：是否克隆 */
    createDataEvent: Function;
    /** 添加组织-角色事件 */
    addOrganizationalRoleEvent: Function;
    /** 删除组织-角色事件 */
    removeOrganizationalRoleEvent: Function;
    /** 选则-组织 */
    chooseOrganizationEvent: Function;
    /** 选则-所属组织 */
    chooseOrganizationalStructureEvent: Function;
    /** 选则-经理 */
    chooseManagerEvent: Function;
    /** 显示数据 */
    showOrganizationalRoles(datas: bo.OrganizationalRole[]): void;
    /** 选则-组织角色 */
    chooseOrganizationalRoleEvent: Function;
    /** 选中-组织角色 */
    selectedOrganizationalRoleEvent: Function;
    /** 添加角色-成员事件 */
    addRoleMemberEvent: Function;
    /** 删除角色-成员事件 */
    removeRoleMemberEvent: Function;
    /** 显示数据 */
    showRoleMembers(datas: bo.RoleMember[]): void;
    /** 选择-角色成员 */
    choooseRoleMemberEvent: Function;
}
