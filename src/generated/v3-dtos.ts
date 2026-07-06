/* Options:
Date: 2026-06-10 12:03:21
Version: 5.80
Tip: To override a DTO option, remove "//" prefix before updating
BaseUrl: https://<your-v3-host>/api

//GlobalNamespace: 
//AddServiceStackTypes: True
//AddResponseStatus: False
//AddImplicitVersion: 
//AddDescriptionAsComments: True
//IncludeTypes: 
//ExcludeTypes: 
//DefaultImports: 
*/


export interface IReturn<T>
{
    createResponse(): T;
}

export interface IReturnVoid
{
    createResponse(): void;
}

export interface IGet
{
}

export interface IPost
{
}

export interface IPatch
{
}

export interface IDelete
{
}

export enum NotificationTypes
{
    None = 'None',
    ReservationReminder = 'ReservationReminder',
    ReservationScheduled = 'ReservationScheduled',
    ReservationRescheduled = 'ReservationRescheduled',
    ReservationPendingApproval = 'ReservationPendingApproval',
    TicketActivity = 'TicketActivity',
    TicketStatusChanged = 'TicketStatusChanged',
    TicketOpened = 'TicketOpened',
    AppointmentReminder = 'AppointmentReminder',
    AppointmentScheduled = 'AppointmentScheduled',
    AppointmentRescheduled = 'AppointmentRescheduled',
    FormFilledOut = 'FormFilledOut',
    ClientInformationChanged = 'ClientInformationChanged',
    ActivityScheduled = 'ActivityScheduled',
    ActivityRescheduled = 'ActivityRescheduled',
    ActivityReminder = 'ActivityReminder',
    CenterHomePageContentChanged = 'CenterHomePageContentChanged',
    ReservationCancelled = 'ReservationCancelled',
    ContactBirthday = 'ContactBirthday',
    LeadCreated = 'LeadCreated',
    CallAllowanceExpired = 'CallAllowanceExpired',
    ClientAIOnboarding = 'ClientAIOnboarding',
}

export class EntityInfo
{
    public id: string;
    public _DisplayName: string;

    public constructor(init?: Partial<EntityInfo>) { (Object as any).assign(this, init); }
}

export class AdministratorInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public userName: string;
    public emailAddress: string;
    public firstName: string;
    public lastName: string;
    public centerId: string;
    public centerName: string;
    public password: string;
    public failedLoginAttempts: number;
    public loginDisabled: boolean;
    public phoneTeam: string;
    public notifications: NotificationTypes[];
    public notificationCentersIds: string[];
    public notificationCentersNames: string[];

    public constructor(init?: Partial<AdministratorInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditAdministrator
{
    public userName: string;
    public emailAddress: string;
    public firstName: string;
    public lastName: string;
    public centerId: string;
    public password: string;
    public failedLoginAttempts: number;
    public loginDisabled: boolean;
    public phoneTeam: string;
    public notifications: NotificationTypes[];
    public notificationCentersIds: string[];

    public constructor(init?: Partial<EditAdministrator>) { (Object as any).assign(this, init); }
}

export class DateRangeFilter
{
    public start: string;
    public end: string;

    public constructor(init?: Partial<DateRangeFilter>) { (Object as any).assign(this, init); }
}

export enum SortOrders
{
    Ascend = 'Ascend',
    Descend = 'Descend',
}

export class ListRequest<T> implements IGet
{
    /**
    * The page of data to retrieve
    */
    // @ApiMember(Description="The page of data to retrieve")
    public page: number;

    /**
    * The number per page to retrieve
    */
    // @ApiMember(Description="The number per page to retrieve")
    public countPerPage: number;

    /**
    * Specify a sort field
    */
    // @ApiMember(Description="Specify a sort field")
    public sortField: string;

    /**
    * Specify a sort order
    */
    // @ApiMember(Description="Specify a sort order")
    public sortOrder: SortOrders;

    /**
    * A generic query that is entity specific. Typically filters by name fields
    */
    // @ApiMember(Description="A generic query that is entity specific. Typically filters by name fields")
    public query: string;

    public constructor(init?: Partial<ListRequest<T>>) { (Object as any).assign(this, init); }
}

export class ListEntitiesRequest<T> extends ListRequest<T> implements IGet
{
    public ids: string[];
    public archived: boolean;
    public detailed: boolean;
    public fields: string[];

    public constructor(init?: Partial<ListEntitiesRequest<T>>) { super(init); (Object as any).assign(this, init); }
}

export class AIBillingPlanInfo
{
    public planId: string;
    public planName: string;
    public monthlyCost: number;
    public includedMinutes: number;
    public additionalMinuteCost: number;
    public retailMonthlyCost: number;
    public retailAdditionalMinuteCost: number;
    public includedChats: number;
    public additionalChatCost: number;
    public retailAdditionalChatCost: number;
    public includedEmails: number;
    public additionalEmailCost: number;
    public retailAdditionalEmailCost: number;
    public effectiveDate: string;
    public requestedDate: string;
    public changedBy: string;

    public constructor(init?: Partial<AIBillingPlanInfo>) { (Object as any).assign(this, init); }
}

export class AIBillingBundleInfo
{
    public bundleId: string;
    public bundleName: string;
    public includedMinutes: number;
    public includedChats: number;
    public includedEmails: number;
    public monthlyCost: number;
    public retailMonthlyCost: number;
    public activatedDate: string;
    public deactivatedDate: string;

    public constructor(init?: Partial<AIBillingBundleInfo>) { (Object as any).assign(this, init); }
}

export class AIBillingClientData
{
    public clientId: string;
    public clientName: string;
    public customerId: string;
    public customerName: string;
    public centerId: string;
    public centerName: string;
    public renewalDay: number;
    public confirmedAt: string;
    public isCancelled: boolean;
    public currentPlan: AIBillingPlanInfo;
    public pendingChange: AIBillingPlanInfo;
    public planHistory: AIBillingPlanInfo[];
    public activeBundles: AIBillingBundleInfo[];

    public constructor(init?: Partial<AIBillingClientData>) { (Object as any).assign(this, init); }
}

export class CustomerAIBundleInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public includedMinutes: number;
    public includedChats: number;
    public includedEmails: number;
    public monthlyCost: number;
    public retailMonthlyCost: number;
    public notes: string;

    public constructor(init?: Partial<CustomerAIBundleInfo>) { super(init); (Object as any).assign(this, init); }
}

export class CustomerAIPlanInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public includedMinutes: number;
    public monthlyCost: number;
    public additionalMinuteCost: number;
    public retailMonthlyCost: number;
    public retailAdditionalMinuteCost: number;
    public includedChats: number;
    public additionalChatCost: number;
    public retailAdditionalChatCost: number;
    public includedEmails: number;
    public additionalEmailCost: number;
    public retailAdditionalEmailCost: number;
    public notes: string;

    public constructor(init?: Partial<CustomerAIPlanInfo>) { super(init); (Object as any).assign(this, init); }
}

export class TimeZoneResponseInfo
{
    public id: string;
    public displayName: string;

    public constructor(init?: Partial<TimeZoneResponseInfo>) { (Object as any).assign(this, init); }
}

export enum ClientAIOnboardingHours
{
    Always = 'Always',
    BusinessHours = 'BusinessHours',
    AfterHours = 'AfterHours',
}

export enum ClientAIOnboardingPhoneNumber
{
    UseExistingPhoneNumber = 'UseExistingPhoneNumber',
    UseNewPhoneNumber = 'UseNewPhoneNumber',
}

export enum ClientAIKnowledgeBaseSources
{
    Links = 'Links',
    SiteMap = 'SiteMap',
    Text = 'Text',
}

export class ClientAIKnowledgeBaseSourceInfo
{
    public _DisplayName: string;
    public source: ClientAIKnowledgeBaseSources;
    public content: string;
    public useExternalAIContext: boolean;
    public toolName: string;
    public toolDescription: string;
    public titleOverride: string;

    public constructor(init?: Partial<ClientAIKnowledgeBaseSourceInfo>) { (Object as any).assign(this, init); }
}

export class ClientAIWordInfo
{
    public _DisplayName: string;
    public word: string;
    public pronounced: string;

    public constructor(init?: Partial<ClientAIWordInfo>) { (Object as any).assign(this, init); }
}

export class ClientAIOnboardingLinkInfo
{
    public _DisplayName: string;
    public url: string;
    public description: string;

    public constructor(init?: Partial<ClientAIOnboardingLinkInfo>) { (Object as any).assign(this, init); }
}

export enum EmailAddressTypes
{
    To = 'To',
    Cc = 'Cc',
    Bcc = 'Bcc',
}

export class EmailAddressInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public address: string;
    public type: EmailAddressTypes;

    public constructor(init?: Partial<EmailAddressInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum TransferTypes
{
    Both = 'Both',
    Blind = 'Blind',
    Supervised = 'Supervised',
}

export enum AITransferTypes
{
    InheritFromClient = 'InheritFromClient',
    None = 'None',
    Blind = 'Blind',
    Supervised = 'Supervised',
    MessagesOnly = 'MessagesOnly',
    TakeHumanValue = 'TakeHumanValue',
    Voicemail = 'Voicemail',
    Scheduled = 'Scheduled',
}

export enum CenterAvailabilityDateTypes
{
    Normal = 'Normal',
    SpecificDate = 'SpecificDate',
    DayOfYear = 'DayOfYear',
    Monday = 'Monday',
    Tuesday = 'Tuesday',
    Wednesday = 'Wednesday',
    Thursday = 'Thursday',
    Friday = 'Friday',
    Saturday = 'Saturday',
    Sunday = 'Sunday',
    Weekends = 'Weekends',
    Christmas = 'Christmas',
    NewYears = 'NewYears',
    Thanksgiving = 'Thanksgiving',
}

export class CenterBusinessHoursInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public type: CenterAvailabilityDateTypes;
    public closed: boolean;
    public opensAt: string;
    public closesAt: string;
    public specificDate: string;

    public constructor(init?: Partial<CenterBusinessHoursInfo>) { super(init); (Object as any).assign(this, init); }
}

export class CenterAvailabilityInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public businessHours: CenterBusinessHoursInfo[];

    public constructor(init?: Partial<CenterAvailabilityInfo>) { super(init); (Object as any).assign(this, init); }
}

export class PhoneNumberInfo extends EntityInfo
{
    public aiAvailable: boolean;
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public number: string;
    public defaultBlindTransfer: boolean;
    public callControl: boolean;
    public dialingRuleId: string;
    public dialingRuleName: string;
    public hideBlindTransfer: boolean;
    public transferTypes: TransferTypes;
    public mobilePhone: boolean;
    public notify: boolean;
    public aiTransferType: AITransferTypes;
    public aiAvailability: CenterAvailabilityInfo;
    public aiDuringHoursTransferType: AITransferTypes;
    public aiAfterHoursTransferType: AITransferTypes;

    public constructor(init?: Partial<PhoneNumberInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ClientAIOnboardingContactInfo
{
    public _DisplayName: string;
    public selected: boolean;
    public firstName: string;
    public lastName: string;
    public department: string;
    public position: string;
    public instructions: string;
    public emailAddresses: EmailAddressInfo[];
    public status: string;
    public phoneNumbers: PhoneNumberInfo[];

    public constructor(init?: Partial<ClientAIOnboardingContactInfo>) { (Object as any).assign(this, init); }
}

export enum FormFieldTypes
{
    Text = 'Text',
    MultiLineText = 'MultiLineText',
    Number = 'Number',
    DropDown = 'DropDown',
    EmailAddress = 'EmailAddress',
    Password = 'Password',
    CallerName = 'CallerName',
    CallerNumber = 'CallerNumber',
    CallerEmailAddress = 'CallerEmailAddress',
    CallerNotes = 'CallerNotes',
}

export class FormFieldInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public type: FormFieldTypes;
    public prompt: string;
    public defaultValue: string;
    public required: boolean;
    public choices: string;
    public internalUse: boolean;
    public apiName: string;

    public constructor(init?: Partial<FormFieldInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ClientAIOnboardingFormInfo
{
    public _DisplayName: string;
    public name: string;
    public fields: FormFieldInfo[];
    public purpose: string;

    public constructor(init?: Partial<ClientAIOnboardingFormInfo>) { (Object as any).assign(this, init); }
}

export class AIPlanHistoryInfo
{
    public planId: string;
    public planName: string;
    public monthlyCost: number;
    public includedMinutes: number;
    public additionalMinuteCost: number;
    public retailMonthlyCost: number;
    public retailAdditionalMinuteCost: number;
    public includedChats: number;
    public additionalChatCost: number;
    public retailAdditionalChatCost: number;
    public includedEmails: number;
    public additionalEmailCost: number;
    public retailAdditionalEmailCost: number;
    public effectiveDate: string;
    public effectiveDateUtc: string;
    public requestedDate: string;
    public requestedDateUtc: string;
    public changedBy: string;
    public status: string;

    public constructor(init?: Partial<AIPlanHistoryInfo>) { (Object as any).assign(this, init); }
}

export class ActiveAIPlanInfo
{
    public clientId: string;
    public clientName: string;
    public centerTimeZoneId: string;
    public renewalDay: number;
    public billingPeriodStart: string;
    public billingPeriodStartUtc: string;
    public cancelledDate: string;
    public cancelledDateUtc: string;
    public scheduledCancellationDate: string;
    public scheduledCancellationDateUtc: string;
    public planAtBillingStart: AIPlanHistoryInfo;

    public constructor(init?: Partial<ActiveAIPlanInfo>) { (Object as any).assign(this, init); }
}

export class ActiveBundleInfo
{
    public assignmentId: string;
    public bundleId: string;
    public bundleName: string;
    public includedMinutes: number;
    public includedChats: number;
    public includedEmails: number;
    public monthlyCost: number;
    public retailMonthlyCost: number;
    public activatedDate: string;
    public deactivatedDate: string;
    public changedBy: string;
    public status: string;

    public constructor(init?: Partial<ActiveBundleInfo>) { (Object as any).assign(this, init); }
}

export enum AISessionPermissions
{
    NotVisible = 'NotVisible',
    ReadOnly = 'ReadOnly',
    ReadWrite = 'ReadWrite',
    ReadWriteDelete = 'ReadWriteDelete',
}

export class AISessionInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public purpose: string;
    public centerPermissions: AISessionPermissions;
    public clientPermissions: AISessionPermissions;
    public contactPermissions: AISessionPermissions;
    public formPermissions: AISessionPermissions;
    public servicePermissions: AISessionPermissions;
    public contractPermissions: AISessionPermissions;
    public meetingRoomPermissions: AISessionPermissions;
    public resourcePermissions: AISessionPermissions;
    public reservationPermissions: AISessionPermissions;

    public constructor(init?: Partial<AISessionInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditAISession
{
    public centerId: string;
    public purpose: string;
    public centerPermissions: AISessionPermissions;
    public clientPermissions: AISessionPermissions;
    public contactPermissions: AISessionPermissions;
    public formPermissions: AISessionPermissions;
    public servicePermissions: AISessionPermissions;
    public contractPermissions: AISessionPermissions;
    public meetingRoomPermissions: AISessionPermissions;
    public resourcePermissions: AISessionPermissions;
    public reservationPermissions: AISessionPermissions;

    public constructor(init?: Partial<EditAISession>) { (Object as any).assign(this, init); }
}

export class AIUsage
{
    public centerId: string;
    public centerName: string;
    public clientId: string;
    public clientName: string;
    public numberOfCalls: number;
    public totalUsedMinutes: number;
    public additionalUsedMinutes: number;
    public planName: string;
    public planIncludedMinutes: number;
    public planMonthlyCost: number;
    public planAdditionalMinuteCost: number;
    public totalCost: number;
    public hasError: boolean;
    public errorMessage: string;

    public constructor(init?: Partial<AIUsage>) { (Object as any).assign(this, init); }
}

export class ListEvents<TEvent> implements IGet
{
    public start: string;
    public end: string;

    public constructor(init?: Partial<ListEvents<TEvent>>) { (Object as any).assign(this, init); }
}

export class GetEvent<TEvent> implements IGet
{
    public id: string;

    public constructor(init?: Partial<GetEvent<TEvent>>) { (Object as any).assign(this, init); }
}

export enum AppointmentType
{
    Normal = 'Normal',
    Recurring = 'Recurring',
    Instance = 'Instance',
    Deletion = 'Deletion',
    Exception = 'Exception',
    Linked = 'Linked',
}

export enum AppointmentStatus
{
    Scheduled = 'Scheduled',
    Cancelled = 'Cancelled',
    PendingApproval = 'PendingApproval',
    Denied = 'Denied',
}

export class AttendeeInfo
{
    public id: string;
    public name: string;
    public emailAddress: string;
    public phoneNumber: string;
    public doorCode: string;

    public constructor(init?: Partial<AttendeeInfo>) { (Object as any).assign(this, init); }
}

export enum TimeUnits
{
    Minutes = 'Minutes',
    Hours = 'Hours',
    Days = 'Days',
    Weeks = 'Weeks',
    Months = 'Months',
    Years = 'Years',
}

export class TimeSpecifierInfo
{
    public _DisplayName: string;
    public quantity: number;
    public unit: TimeUnits;

    public constructor(init?: Partial<TimeSpecifierInfo>) { (Object as any).assign(this, init); }
}

export class ReminderInfo
{
    public id: string;
    public when: TimeSpecifierInfo;

    public constructor(init?: Partial<ReminderInfo>) { (Object as any).assign(this, init); }
}

export enum RecurrenceTypes
{
    None = 'None',
    Secondly = 'Secondly',
    Minutely = 'Minutely',
    Hourly = 'Hourly',
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    Yearly = 'Yearly',
}

export enum RecurrenceEndConditions
{
    DoesNotEnd = 'DoesNotEnd',
    AfterCount = 'AfterCount',
    OnDate = 'OnDate',
}

export enum RecurrenceInstances
{
    None = 'None',
    First = 'First',
    Second = 'Second',
    Third = 'Third',
    Fourth = 'Fourth',
    Last = 'Last',
}

export enum DaysOfWeek
{
    None = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 4,
    Thursday = 8,
    Friday = 16,
    Saturday = 32,
    Sunday = 64,
}

export class RecurrenceInfo
{
    public type: RecurrenceTypes;
    public endCondition: RecurrenceEndConditions;
    public interval: number;
    public count: number;
    public endDate: string;
    public instance: RecurrenceInstances;
    public daysOfWeek: DaysOfWeek[];
    public dayOfMonth: number;
    public monthOfYear: number;

    public constructor(init?: Partial<RecurrenceInfo>) { (Object as any).assign(this, init); }
}

export class EventInfo
{
    public id: string;
    public type: AppointmentType;
    public status: AppointmentStatus;
    public lastModifiedByName: string;
    public lastModifiedById: string;
    public lastModifiedDate: string;
    public createdByName: string;
    public createdById: string;
    public dateCreated: string;
    public originalDate: string;
    public start: string;
    public end: string;
    public subject: string;
    public notes: string;
    public attendees: AttendeeInfo[];
    public contactIds: string[];
    public reminders: ReminderInfo[];
    public recurrenceInfo: RecurrenceInfo;

    public constructor(init?: Partial<EventInfo>) { (Object as any).assign(this, init); }
}

export class NewEvent<TEvent> implements IPost, IUpdateEvent
{
    public start: string;
    public end: string;
    public subject: string;
    public notes: string;
    public attendees: AttendeeInfo[];
    public contactIds: string[];
    public reminders: ReminderInfo[];
    public recurrenceInfo: RecurrenceInfo;

    public constructor(init?: Partial<NewEvent<TEvent>>) { (Object as any).assign(this, init); }
}

export interface IUpdateEvent
{
    subject: string;
    notes: string;
    attendees: AttendeeInfo[];
    contactIds: string[];
    reminders: ReminderInfo[];
    recurrenceInfo: RecurrenceInfo;
}

export interface IUpdateAppointment extends IUpdateEvent
{
    calendarId: string;
}

export enum PatchEventStatuses
{
    Approved = 'Approved',
    Cancelled = 'Cancelled',
    Scheduled = 'Scheduled',
    Denied = 'Denied',
}

export class PatchEvent<TEvent> implements IPatch, IUpdateEvent
{
    public id: string;
    public originalDate: string;
    public start: string;
    public end: string;
    public subject: string;
    public notes: string;
    public status: PatchEventStatuses;
    public attendees: AttendeeInfo[];
    public contactIds: string[];
    public reminders: ReminderInfo[];
    public recurrenceInfo: RecurrenceInfo;

    public constructor(init?: Partial<PatchEvent<TEvent>>) { (Object as any).assign(this, init); }
}

export class DeleteEvent<TEvent> implements IDelete
{
    public id: string;

    public constructor(init?: Partial<DeleteEvent<TEvent>>) { (Object as any).assign(this, init); }
}

export enum DoubleBookingPolicy
{
    NeverAllow = 'NeverAllow',
    AlwaysAllow = 'AlwaysAllow',
    AllowUntilMaxConcurrentBookings = 'AllowUntilMaxConcurrentBookings',
    AllowWithPermissions = 'AllowWithPermissions',
}

export class CalendarAIGatherDataInfo
{
    public _DisplayName: string;
    public fieldName: string;
    public description: string;

    public constructor(init?: Partial<CalendarAIGatherDataInfo>) { (Object as any).assign(this, init); }
}

export class CalendarAISettingsInfo
{
    public _DisplayName: string;
    public enabled: boolean;
    public description: string;
    public bookingSubject: string;
    public bookingDurationInMinutes: number;
    public dataToGather: CalendarAIGatherDataInfo[];
    public emailAdminsOnBooking: boolean;
    public emailClientsOnBooking: boolean;
    public extraNotificationInformation: string;

    public constructor(init?: Partial<CalendarAISettingsInfo>) { (Object as any).assign(this, init); }
}

export class CalendarInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public clientId: string;
    public clientName: string;
    public doubleBookingPolicy: DoubleBookingPolicy;
    public maxConcurrentBookings: number;
    public aiSettings: CalendarAISettingsInfo;

    public constructor(init?: Partial<CalendarInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditCalendar
{
    public name: string;
    public clientId: string;
    public doubleBookingPolicy: DoubleBookingPolicy;
    public maxConcurrentBookings: number;
    public aiSettings: CalendarAISettingsInfo;

    public constructor(init?: Partial<EditCalendar>) { (Object as any).assign(this, init); }
}

export class CallInsightChartSettings
{
    public insightId: string;
    public fieldName: string;

    public constructor(init?: Partial<CallInsightChartSettings>) { (Object as any).assign(this, init); }
}

export class CallInsightStat
{
    public name: string;
    public value: string;

    public constructor(init?: Partial<CallInsightStat>) { (Object as any).assign(this, init); }
}

export enum ChartTypes
{
    Pie = 'Pie',
}

export class PieChartDatum
{
    public id: string;
    public label: string;
    public color: string;
    public value: number;

    public constructor(init?: Partial<PieChartDatum>) { (Object as any).assign(this, init); }
}

export class PieChart
{
    public data: PieChartDatum[];
    public useDataColors: boolean;
    public showArcLabels: boolean;
    public valueFormat: string;

    public constructor(init?: Partial<PieChart>) { (Object as any).assign(this, init); }
}

export class CallInsightChart
{
    public type: ChartTypes;
    public title: string;
    public pieChart: PieChart;

    public constructor(init?: Partial<CallInsightChart>) { (Object as any).assign(this, init); }
}

export class CallPartySentimentInfo
{
    public _DisplayName: string;
    public positive: number;
    public neutral: number;
    public negative: number;

    public constructor(init?: Partial<CallPartySentimentInfo>) { (Object as any).assign(this, init); }
}

export class TranscriptLine
{
    public time: number;
    public speaker: string;
    public text: string;
    public sentiment: number;

    public constructor(init?: Partial<TranscriptLine>) { (Object as any).assign(this, init); }
}

export class LiveAnswerDataTranscriptMessage
{
    public date: string;
    public role: string;
    public senderName: string;
    public targetName: string;
    public functionName: string;
    public functionArgs: string;
    public content: string;

    public constructor(init?: Partial<LiveAnswerDataTranscriptMessage>) { (Object as any).assign(this, init); }
}

export class LiveAnswerDataAttachment
{
    public fileName: string;
    public contentType: string;
    public uri: string;
    public data: string;

    public constructor(init?: Partial<LiveAnswerDataAttachment>) { (Object as any).assign(this, init); }
}

export class LiveAnswerData
{
    public sessionId: string;
    public flowId: string;
    public nodeId: string;
    public clientId: string;
    public conversationId: string;
    public aiMinutes: number;
    public from: string;
    public to: string;
    public transcript: LiveAnswerDataTranscriptMessage[];
    public startDate: string;
    public endDate: string;
    public attachments: LiveAnswerDataAttachment[];
    public completed: string;
    public callRecordingUrl: string;

    public constructor(init?: Partial<LiveAnswerData>) { (Object as any).assign(this, init); }
}

export class TransferTranscript
{
    public partyName: string;
    public callRecordingUrl: string;
    public transcript: TranscriptLine[];

    public constructor(init?: Partial<TransferTranscript>) { (Object as any).assign(this, init); }
}

export enum CallInsightFieldTypes
{
    Number = 'Number',
    Text = 'Text',
    Range = 'Range',
    Enum = 'Enum',
    Boolean = 'Boolean',
}

export class CallInsightFieldInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public type: CallInsightFieldTypes;
    public description: string;
    public minRange: number;
    public maxRange: number;
    public enumValues: string;
    public includeOnDashboard: boolean;
    public showChartOnDashboard: boolean;

    public constructor(init?: Partial<CallInsightFieldInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum CallInsightUsage
{
    OperatorCalls = 'OperatorCalls',
    LiveAnswerAICalls = 'LiveAnswerAICalls',
    AllCalls = 'AllCalls',
}

export class CallInsightInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centersIds: string[];
    public centersNames: string[];
    public clientId: string;
    public clientName: string;
    public instructions: string;
    public fields: CallInsightFieldInfo[];
    public webhookUrl: string;
    public usage: CallInsightUsage;

    public constructor(init?: Partial<CallInsightInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditCallInsight
{
    public name: string;
    public centersIds: string[];
    public clientId: string;
    public instructions: string;
    public fields: CallInsightFieldInfo[];
    public webhookUrl: string;
    public usage: CallInsightUsage;

    public constructor(init?: Partial<EditCallInsight>) { (Object as any).assign(this, init); }
}

export enum CategoryRoles
{
    None = 'None',
    CallDisposition = 'CallDisposition',
}

export enum Icons
{
    None = 'None',
    User = 'User',
    GrayUser = 'GrayUser',
    Table = 'Table',
    Star = 'Star',
    Smiley = 'Smiley',
    Envelope = 'Envelope',
    Heart = 'Heart',
    Sms = 'Sms',
    Clock = 'Clock',
    Car = 'Car',
    Streaming = 'Streaming',
    Server = 'Server',
    Copy = 'Copy',
    Time = 'Time',
    DataSource = 'DataSource',
    Connect = 'Connect',
    Comment = 'Comment',
    Help = 'Help',
    Activity = 'Activity',
    Task = 'Task',
    Keyboard = 'Keyboard',
    Wand = 'Wand',
    Tree = 'Tree',
    Debug = 'Debug',
    Form = 'Form',
    Workflow = 'Workflow',
    MeetingRoom = 'MeetingRoom',
    Add = 'Add',
    Balloon = 'Balloon',
    Disk = 'Disk',
    Refresh = 'Refresh',
    Search = 'Search',
    Find = 'Find',
    Print = 'Print',
    Home = 'Home',
    Reminder = 'Reminder',
    Visibility = 'Visibility',
    Cross = 'Cross',
    Plus = 'Plus',
    Answer = 'Answer',
    Merge = 'Merge',
    Lock = 'Lock',
    Hangup = 'Hangup',
    Hold = 'Hold',
    Html = 'Html',
    InfoBalloon = 'InfoBalloon',
    Money = 'Money',
    Required = 'Required',
    Attachment = 'Attachment',
    Settings = 'Settings',
    Sync = 'Sync',
    Parameters = 'Parameters',
    Designer = 'Designer',
    Line = 'Line',
    Text = 'Text',
    Document = 'Document',
    Pdf = 'Pdf',
    Excel = 'Excel',
    Word = 'Word',
    Image = 'Image',
    Label = 'Label',
    Report = 'Report',
    Client = 'Client',
    Contact = 'Contact',
    Lead = 'Lead',
    Room = 'Room',
    Appointment = 'Appointment',
    Ticket = 'Ticket',
    Key = 'Key',
    Tags = 'Tags',
    Repeats = 'Repeats',
    Resource = 'Resource',
    Delete = 'Delete',
    Information = 'Information',
    Navigation = 'Navigation',
    Computer = 'Computer',
    Collapse = 'Collapse',
    Expand = 'Expand',
    Link = 'Link',
    Minus = 'Minus',
    Archive = 'Archive',
    PhoneCall = 'PhoneCall',
    UpDown = 'UpDown',
    Script = 'Script',
    Address = 'Address',
    Restore = 'Restore',
    Import = 'Import',
    Error = 'Error',
    Exclamation = 'Exclamation',
    Desktop = 'Desktop',
}

export class CategoryInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public description: string;
    public centerId: string;
    public centerName: string;
    public role: CategoryRoles;
    public displayWithNameInConsole: boolean;
    public callBoxColor: string;
    public icon: Icons;
    public callBoxIcon: Icons;

    public constructor(init?: Partial<CategoryInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditCategory
{
    public name: string;
    public description: string;
    public centerId: string;
    public role: CategoryRoles;
    public displayWithNameInConsole: boolean;
    public callBoxColor: string;
    public icon: Icons;
    public callBoxIcon: Icons;

    public constructor(init?: Partial<EditCategory>) { (Object as any).assign(this, init); }
}

export class AddressInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public street1: string;
    public street2: string;
    public city: string;
    public state: string;
    public postalCode: string;
    public country: string;
    public latitude: number;
    public longitude: number;

    public constructor(init?: Partial<AddressInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum ReservationBookingInterval
{
    Default = 0,
    FiveMinutes = 5,
    FifteenMinutes = 15,
    ThirtyMinutes = 30,
    Hourly = 60,
}

export enum SchedulingAfterHoursPolicy
{
    DoNotAllow = 'DoNotAllow',
    AllowPending = 'AllowPending',
    Allow = 'Allow',
}

export enum CancellationPolicyTypes
{
    AlwaysAllow = 'AlwaysAllow',
    DenyWithinWindow = 'DenyWithinWindow',
    DoNotAllow = 'DoNotAllow',
    FlagWithinWindow = 'FlagWithinWindow',
}

export class CancellationPolicyInfo
{
    public _DisplayName: string;
    public type: CancellationPolicyTypes;
    public window: TimeSpecifierInfo;

    public constructor(init?: Partial<CancellationPolicyInfo>) { (Object as any).assign(this, init); }
}

export class CenterBookingWindowInfo
{
    public _DisplayName: string;
    public enabled: boolean;
    public window: TimeSpecifierInfo;

    public constructor(init?: Partial<CenterBookingWindowInfo>) { (Object as any).assign(this, init); }
}

export class CustomFieldInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public value: string;
    public required: boolean;

    public constructor(init?: Partial<CustomFieldInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum SurchargeTypes
{
    None = 'None',
    Percentage = 'Percentage',
    Flat = 'Flat',
}

export class RateSurchargeInfo
{
    public _DisplayName: string;
    public type: SurchargeTypes;
    public amount: number;

    public constructor(init?: Partial<RateSurchargeInfo>) { (Object as any).assign(this, init); }
}

export class MultiLevelRateInfo
{
    public _DisplayName: string;
    public quantity: number;
    public unitCost: number;
    public isFixedCost: boolean;

    public constructor(init?: Partial<MultiLevelRateInfo>) { (Object as any).assign(this, init); }
}

export class RateInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public serviceId: string;
    public serviceName: string;
    public unitCost: number;
    public surcharge: RateSurchargeInfo;
    public level1Pricing: MultiLevelRateInfo;
    public level2Pricing: MultiLevelRateInfo;
    public level3Pricing: MultiLevelRateInfo;

    public constructor(init?: Partial<RateInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum AllowanceApplications
{
    MostExpensiveFirst = 'MostExpensiveFirst',
    LeastExpensiveFirst = 'LeastExpensiveFirst',
    DivideEvenly = 'DivideEvenly',
    SingleMostExpensive = 'SingleMostExpensive',
    SingleLeastExpensive = 'SingleLeastExpensive',
    InDateOrder = 'InDateOrder',
}

export class AllowanceInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public serviceId: string;
    public serviceName: string;
    public amount: number;
    public description: string;
    public applyTo: AllowanceApplications;

    public constructor(init?: Partial<AllowanceInfo>) { super(init); (Object as any).assign(this, init); }
}

export class RatePlanInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public rates: RateInfo[];
    public allowances: AllowanceInfo[];

    public constructor(init?: Partial<RatePlanInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum CenterBillingCycleDaySpecifiers
{
    FirstDayInMonth = 'FirstDayInMonth',
    LastDayInMonth = 'LastDayInMonth',
    SpecificDayInMonth = 'SpecificDayInMonth',
}

export class CenterBillingCycleDayInfo
{
    public _DisplayName: string;
    public type: CenterBillingCycleDaySpecifiers;
    public day: number;

    public constructor(init?: Partial<CenterBillingCycleDayInfo>) { (Object as any).assign(this, init); }
}

export class CenterBillingSettingsInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public address: AddressInfo;
    public emailAddress: string;
    public defaultInvoiceMessage: string;
    public startingInvoiceNumber: number;
    public taxNumber: string;
    public phoneNumber: string;
    public companyName: string;
    public startOfBillingCycle: CenterBillingCycleDayInfo;
    public endOfBillingCycle: CenterBillingCycleDayInfo;
    public requireQuantityOnAllCharges: boolean;

    public constructor(init?: Partial<CenterBillingSettingsInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum EmailServerTypes
{
    HostedSuite = 'HostedSuite',
    Custom = 'Custom',
    None = 'None',
}

export enum EmailServerEncryption
{
    None = 'None',
    SSL = 'SSL',
    TLS = 'TLS',
}

export class EmailServerSettingsInfo
{
    public _DisplayName: string;
    public server: string;
    public userName: string;
    public password: string;
    public port: number;
    public encryption: EmailServerEncryption;
    public startTls: boolean;

    public constructor(init?: Partial<EmailServerSettingsInfo>) { (Object as any).assign(this, init); }
}

export class CenterEmailSettingsInfo
{
    public _DisplayName: string;
    public emailUpdatesEnabled: boolean;
    public subjectToUpdateStatus: string;
    public subjectToUpdateAlert: string;
    public signature: string;
    public replyToAddress: string;
    public emailNotificationSubject: string;
    public serverType: EmailServerTypes;
    public incomingServer: EmailServerSettingsInfo;
    public outgoingServer: EmailServerSettingsInfo;
    public emailAddress: string;
    public emailAddressName: string;
    public runOnServerId: string;
    public runOnServerName: string;
    public sendFromHostedSuiteDotCom: boolean;
    public sendEmailImmediately: boolean;
    public emailAddressToNotifyOnFailure: string;
    public defaultEmailSubject: string;
    public callAllowanceNotificationMessage: string;

    public constructor(init?: Partial<CenterEmailSettingsInfo>) { (Object as any).assign(this, init); }
}

export class ThirdPartyInformationInfo
{
    public _DisplayName: string;
    public thirdPartyReferenceCode: string;
    public exchangeId: string;
    public quickBooksName: string;
    public quickBooksClass: string;
    public thirdPartyAccountId: string;
    public voiceCustomerId: string;
    public officeRndId: string;
    public goHighLevelApiKey: string;

    public constructor(init?: Partial<ThirdPartyInformationInfo>) { (Object as any).assign(this, init); }
}

export enum CenterSharedCallVisibility
{
    Default = 'Default',
    Always = 'Always',
    OnHold = 'OnHold',
    Never = 'Never',
}

export class CenterPhoneSystemSettingsInfo
{
    public _DisplayName: string;
    public sharedCallVisibility: CenterSharedCallVisibility;

    public constructor(init?: Partial<CenterPhoneSystemSettingsInfo>) { (Object as any).assign(this, init); }
}

export enum CenterFormPostHttpMethods
{
    POST = 'POST',
    GET = 'GET',
}

export class CenterFormPostConfigInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public url: string;
    public httpMethod: CenterFormPostHttpMethods;
    public userName: string;
    public password: string;

    public constructor(init?: Partial<CenterFormPostConfigInfo>) { super(init); (Object as any).assign(this, init); }
}

export class CenterAISettingsInfo
{
    public _DisplayName: string;
    public enableAIInsightsForAllClients: boolean;
    public enableGreetingInsight: boolean;
    public enableCallInstructionsInsight: boolean;
    public enableAlertInsight: boolean;
    public enableStatusInsight: boolean;

    public constructor(init?: Partial<CenterAISettingsInfo>) { (Object as any).assign(this, init); }
}

export class CenterInfo extends EntityInfo
{
    public invoiceLogoId: string;
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public timeZoneId: string;
    public address: AddressInfo;
    public phoneNumber: string;
    public tollFreeNumber: string;
    public reservationBookingInterval: ReservationBookingInterval;
    public schedulingAfterHoursPolicy: SchedulingAfterHoursPolicy;
    public requireClientForReservations: boolean;
    public cancellationPolicy: CancellationPolicyInfo;
    public bookingWindow: CenterBookingWindowInfo;
    public reservationCustomFields: CustomFieldInfo[];
    public roomUnavailableMessage: string;
    public unassignedMeetingRoomId: string;
    public unassignedMeetingRoomName: string;
    public homePageContent: string;
    public availability: CenterAvailabilityInfo;
    public ratePlan: RatePlanInfo;
    public defaultContractId: string;
    public defaultContractName: string;
    public memberContractId: string;
    public memberContractName: string;
    public nonMemberContractId: string;
    public nonMemberContractName: string;
    public billing: CenterBillingSettingsInfo;
    public supportEmailAddress: string;
    public emailSettings: CenterEmailSettingsInfo;
    public emailSignature: string;
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public consoleUrlOverride: string;
    public phoneSystemSettings: CenterPhoneSystemSettingsInfo;
    public formPosts: CenterFormPostConfigInfo[];
    public aiSettings: CenterAISettingsInfo;

    public constructor(init?: Partial<CenterInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditCenter
{
    public name: string;
    public timeZoneId: string;
    public address: AddressInfo;
    public phoneNumber: string;
    public tollFreeNumber: string;
    public reservationBookingInterval: ReservationBookingInterval;
    public schedulingAfterHoursPolicy: SchedulingAfterHoursPolicy;
    public requireClientForReservations: boolean;
    public cancellationPolicy: CancellationPolicyInfo;
    public bookingWindow: CenterBookingWindowInfo;
    public reservationCustomFields: CustomFieldInfo[];
    public roomUnavailableMessage: string;
    public unassignedMeetingRoomId: string;
    public homePageContent: string;
    public availability: CenterAvailabilityInfo;
    public ratePlan: RatePlanInfo;
    public defaultContractId: string;
    public memberContractId: string;
    public nonMemberContractId: string;
    public billing: CenterBillingSettingsInfo;
    public supportEmailAddress: string;
    public emailSettings: CenterEmailSettingsInfo;
    public emailSignature: string;
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public consoleUrlOverride: string;
    public phoneSystemSettings: CenterPhoneSystemSettingsInfo;
    public formPosts: CenterFormPostConfigInfo[];
    public aiSettings: CenterAISettingsInfo;

    public constructor(init?: Partial<EditCenter>) { (Object as any).assign(this, init); }
}

export class ChargeInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public dateOfCharge: string;
    public serviceId: string;
    public serviceName: string;
    public clientId: string;
    public clientName: string;
    public contactId: string;
    public contactName: string;
    public quantity: number;
    public cost: number;
    public notes: string;
    public description: string;
    public memorized: boolean;
    public centerId: string;
    public centerName: string;

    public constructor(init?: Partial<ChargeInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditCharge
{
    public dateOfCharge: string;
    public serviceId: string;
    public clientId: string;
    public contactId: string;
    public quantity: number;
    public cost: number;
    public notes: string;
    public description: string;
    public memorized: boolean;

    public constructor(init?: Partial<EditCharge>) { (Object as any).assign(this, init); }
}

export class ClientKbChatMessage
{
    public id: string;
    public role: string;
    public participant: string;
    public content: string;
    public date: string;

    public constructor(init?: Partial<ClientKbChatMessage>) { (Object as any).assign(this, init); }
}

export class ClientKbContent
{
    public title: string;
    public url: string;
    public content: string;

    public constructor(init?: Partial<ClientKbContent>) { (Object as any).assign(this, init); }
}

export class HyperlinkInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public url: string;
    public isAIEnabled: boolean;
    public aiDescription: string;

    public constructor(init?: Partial<HyperlinkInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ScreenPopInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public number: string;
    public callBoxColor: string;
    public greetingColor: string;
    public contactId: string;
    public contactName: string;
    public formToOpenId: string;
    public formToOpenName: string;
    public icon: Icons;

    public constructor(init?: Partial<ScreenPopInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ClientBillingCodeInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public code: string;

    public constructor(init?: Partial<ClientBillingCodeInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum CallAllowanceTypes
{
    NotBillable = 'NotBillable',
    NumberOfMinutes = 'NumberOfMinutes',
    NumberOfCalls = 'NumberOfCalls',
}

export class CallAllowanceInfo
{
    public _DisplayName: string;
    public type: CallAllowanceTypes;
    public amount: number;
    public usedCurrentPeriod: number;
    public notifiedThisPeriod: boolean;
    public notifyWhenGoesOver: boolean;

    public constructor(init?: Partial<CallAllowanceInfo>) { (Object as any).assign(this, init); }
}

export class ClientRatePlanInfo extends EntityInfo
{
    public rates: RateInfo[];
    public allowances: AllowanceInfo[];
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public overrideCenterAllowances: boolean;

    public constructor(init?: Partial<ClientRatePlanInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum ClientAIEngines
{
    Default = 'Default',
    Realtime = 'Realtime',
}

export enum ClientAIConfigSources
{
    Local = 'Local',
    ResellerPortal = 'ResellerPortal',
}

export enum AIToolAvailability
{
    InheritFromClient = 'InheritFromClient',
    None = 'None',
    Available = 'Available',
}

export enum ClientAIIntegrationTypes
{
    Http = 'Http',
    Mcp = 'Mcp',
}

export class ClientAIIntegrationInfo
{
    public _DisplayName: string;
    public type: ClientAIIntegrationTypes;
    public url: string;
    public httpMethod: string;
    public authToken: string;
    public includeChatContext: boolean;

    public constructor(init?: Partial<ClientAIIntegrationInfo>) { (Object as any).assign(this, init); }
}

export enum AIInformationSource
{
    AISettings = 'AISettings',
    NormalInformation = 'NormalInformation',
}

export enum ClientKnowledgeBaseProviders
{
    LiveAnswer = 'LiveAnswer',
    GenieScraper = 'GenieScraper',
}

export class ClientAIEmbedSettingsInfo
{
    public _DisplayName: string;
    public phoneNumber: string;
    public scriptUrl: string;
    public apiEndpoint: string;
    public defaultMessage: string;
    public connectingMessage: string;
    public connectedMessage: string;
    public defaultBackgroundColor: string;
    public connectedBackgroundColor: string;
    public textColor: string;

    public constructor(init?: Partial<ClientAIEmbedSettingsInfo>) { (Object as any).assign(this, init); }
}

export class ClientAIMessageOverrideInfo
{
    public _DisplayName: string;
    public key: string;
    public message: string;

    public constructor(init?: Partial<ClientAIMessageOverrideInfo>) { (Object as any).assign(this, init); }
}

export class ClientAIVoiceOverrideInfo
{
    public _DisplayName: string;
    public locale: string;
    public voice: string;

    public constructor(init?: Partial<ClientAIVoiceOverrideInfo>) { (Object as any).assign(this, init); }
}

export class ClientAISettingsInfo
{
    public _DisplayName: string;
    public aiEnabled: boolean;
    public staging: boolean;
    public aiEngine: ClientAIEngines;
    public configSource: ClientAIConfigSources;
    public resellerPortalAgentId: string;
    public greetingOverride: string;
    public greetingMorningOverride: string;
    public greetingAfternoonOverride: string;
    public greetingEveningOverride: string;
    public defaultTransferType: AITransferTypes;
    public emailToolAvailability: AIToolAvailability;
    public smsToolAvailability: AIToolAvailability;
    public customWords: ClientAIWordInfo[];
    public integrations: ClientAIIntegrationInfo[];
    public customPrompt: string;
    public phonePrompt: string;
    public chatPrompt: string;
    public emailPrompt: string;
    public replaceSystemPrompt: boolean;
    public consolePrompt: string;
    public keywords: string;
    public locale: string;
    public voice: string;
    public voiceStyle: string;
    public includeContactStatus: boolean;
    public includeContactAlert: boolean;
    public informationSource: AIInformationSource;
    public information: string;
    public enableCalendarScheduling: boolean;
    public enableCallInsights: boolean;
    public enableGreetingInsight: boolean;
    public enableCallInstructionsInsight: boolean;
    public enableAlertInsight: boolean;
    public enableStatusInsight: boolean;
    public knowledgeBaseProvider: ClientKnowledgeBaseProviders;
    public knowledgeBaseSources: ClientAIKnowledgeBaseSourceInfo[];
    public embedSettings: ClientAIEmbedSettingsInfo;
    public messageOverrides: ClientAIMessageOverrideInfo[];
    public voiceOverrides: ClientAIVoiceOverrideInfo[];
    public thinkingTimeoutSecs: number;
    public webHookUrl: string;
    public transferMessage: string;
    public timeZoneOverride: string;

    public constructor(init?: Partial<ClientAISettingsInfo>) { (Object as any).assign(this, init); }
}

export class ClientInfo extends EntityInfo
{
    public logoId: string;
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public contractId: string;
    public contractName: string;
    public dedicatedOutboundExtension: string;
    public dedicatedOutboundExtensionSms: string;
    public dedicatedOutboundExtensionTransfers: string;
    public useOriginalCallerIdOnTransfer: boolean;
    public disableSendToAllContactsOptionInForms: boolean;
    public links: HyperlinkInfo[];
    public screenPops: ScreenPopInfo[];
    public information: string;
    public popupInformation: string;
    public faxNumber: string;
    public callInstructions: string;
    public greeting: string;
    public billingCodes: ClientBillingCodeInfo[];
    public billingAddress: AddressInfo;
    public billingEmailAddresses: EmailAddressInfo[];
    public callAllowance: CallAllowanceInfo;
    public location: string;
    public categoriesIds: string[];
    public categoriesNames: string[];
    public callDispositionsIds: string[];
    public callDispositionsNames: string[];
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public referenceId: string;
    public industryId: string;
    public industryName: string;
    public customFields: CustomFieldInfo[];
    public phoneNumbers: PhoneNumberInfo[];
    public disableCallerHistory: boolean;
    public ratePlan: ClientRatePlanInfo;
    public wrapTimeout: number;
    public aiSettings: ClientAISettingsInfo;

    public constructor(init?: Partial<ClientInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditClient
{
    public name: string;
    public centerId: string;
    public contractId: string;
    public dedicatedOutboundExtension: string;
    public dedicatedOutboundExtensionSms: string;
    public dedicatedOutboundExtensionTransfers: string;
    public useOriginalCallerIdOnTransfer: boolean;
    public disableSendToAllContactsOptionInForms: boolean;
    public links: HyperlinkInfo[];
    public screenPops: ScreenPopInfo[];
    public information: string;
    public popupInformation: string;
    public faxNumber: string;
    public callInstructions: string;
    public greeting: string;
    public billingCodes: ClientBillingCodeInfo[];
    public billingAddress: AddressInfo;
    public billingEmailAddresses: EmailAddressInfo[];
    public callAllowance: CallAllowanceInfo;
    public location: string;
    public categoriesIds: string[];
    public callDispositionsIds: string[];
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public referenceId: string;
    public industryId: string;
    public customFields: CustomFieldInfo[];
    public phoneNumbers: PhoneNumberInfo[];
    public disableCallerHistory: boolean;
    public ratePlan: ClientRatePlanInfo;
    public wrapTimeout: number;
    public aiSettings: ClientAISettingsInfo;

    public constructor(init?: Partial<EditClient>) { (Object as any).assign(this, init); }
}

export enum ClientTemplateTypes
{
    MainInformationArea = 'MainInformationArea',
    AssociateRow = 'AssociateRow',
}

export class ClientTemplateInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public type: ClientTemplateTypes;
    public centerId: string;
    public centerName: string;
    public clientId: string;
    public clientName: string;
    public html: string;
    public css: string;
    public order: number;

    public constructor(init?: Partial<ClientTemplateInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditClientTemplate
{
    public name: string;
    public type: ClientTemplateTypes;
    public centerId: string;
    public clientId: string;
    public html: string;
    public css: string;
    public order: number;

    public constructor(init?: Partial<EditClientTemplate>) { (Object as any).assign(this, init); }
}

export class CompletedFormFieldInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public values: string[];

    public constructor(init?: Partial<CompletedFormFieldInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum UpdateAlertStatusTypes
{
    Alert = 'Alert',
    Status = 'Status',
}

export class ConsoleScreenPopInfo extends ScreenPopInfo
{
    public clientId: string;

    public constructor(init?: Partial<ConsoleScreenPopInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum AssociateListOrder
{
    ByFirstName = 'ByFirstName',
    ByLastName = 'ByLastName',
}

export class CustomerChatSnippetInfo
{
    public _DisplayName: string;
    public name: string;
    public text: string;
    public voiceText: string;
    public emailText: string;
    public chatText: string;

    public constructor(init?: Partial<CustomerChatSnippetInfo>) { (Object as any).assign(this, init); }
}

export enum ConsoleSearchTypes
{
    Name = 'Name',
    Company = 'Company',
    ScreenPop = 'ScreenPop',
    Everywhere = 'Everywhere',
    Email = 'Email',
}

export class ConsoleSearchResult
{
    public clientId: string;
    public contactId: string;
    public name: string;
    public extra: string;

    public constructor(init?: Partial<ConsoleSearchResult>) { (Object as any).assign(this, init); }
}

export class ContactEmailAddressInfo extends EntityInfo
{
    public address: string;
    public type: EmailAddressTypes;
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public includeInNotifications: boolean;

    public constructor(init?: Partial<ContactEmailAddressInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ContactKeywordInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;

    public constructor(init?: Partial<ContactKeywordInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum AIVoicemailTypes
{
    TakeMessage = 'TakeMessage',
    RecordAudio = 'RecordAudio',
}

export class ContactAISettingsInfo
{
    public isAvailable: boolean;
    public _DisplayName: string;
    public transferAvailability: CenterAvailabilityInfo;
    public voicemailType: AIVoicemailTypes;
    public emailToolAvailability: AIToolAvailability;
    public smsToolAvailability: AIToolAvailability;

    public constructor(init?: Partial<ContactAISettingsInfo>) { (Object as any).assign(this, init); }
}

export class ScheduledFieldInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public value: string;
    public protected: boolean;
    public expirationDate: string;

    public constructor(init?: Partial<ScheduledFieldInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ContactInfo extends EntityInfo
{
    public photoId: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public clientId: string;
    public clientName: string;
    public firstName: string;
    public lastName: string;
    public title: string;
    public greetingOverride: string;
    public emergencyInstructions: string;
    public faxNumber: string;
    public birthday: string;
    public location: string;
    public sortPosition: number;
    public timeZoneId: string;
    public categoriesIds: string[];
    public categoriesNames: string[];
    public customFields: CustomFieldInfo[];
    public referenceId: string;
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public centerId: string;
    public centerName: string;
    public emailAddresses: ContactEmailAddressInfo[];
    public phoneNumbers: PhoneNumberInfo[];
    public links: HyperlinkInfo[];
    public address: AddressInfo;
    public information: string;
    public keywords: ContactKeywordInfo[];
    public userName: string;
    public userGroupId: string;
    public userGroupName: string;
    public password: string;
    public failedLoginAttempts: number;
    public loginDisabled: boolean;
    public linkedClientsIds: string[];
    public linkedClientsNames: string[];
    public departmentId: string;
    public departmentName: string;
    public responsibilityId: string;
    public responsibilityName: string;
    public relationshipId: string;
    public relationshipName: string;
    public doorCode: string;
    public moreInformation: string;
    public aiSettings: ContactAISettingsInfo;
    public hideInConsole: boolean;
    public alert: ScheduledFieldInfo;
    public status: ScheduledFieldInfo;
    public callInstructions: string;
    public longDistanceCode: string;
    public phoneTeam: string;

    public constructor(init?: Partial<ContactInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditContact
{
    public clientId: string;
    public firstName: string;
    public lastName: string;
    public title: string;
    public greetingOverride: string;
    public emergencyInstructions: string;
    public faxNumber: string;
    public birthday: string;
    public location: string;
    public sortPosition: number;
    public timeZoneId: string;
    public categoriesIds: string[];
    public customFields: CustomFieldInfo[];
    public referenceId: string;
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public emailAddresses: ContactEmailAddressInfo[];
    public phoneNumbers: PhoneNumberInfo[];
    public links: HyperlinkInfo[];
    public address: AddressInfo;
    public information: string;
    public keywords: ContactKeywordInfo[];
    public userName: string;
    public userGroupId: string;
    public password: string;
    public failedLoginAttempts: number;
    public loginDisabled: boolean;
    public linkedClientsIds: string[];
    public departmentId: string;
    public responsibilityId: string;
    public relationshipId: string;
    public doorCode: string;
    public moreInformation: string;
    public aiSettings: ContactAISettingsInfo;
    public hideInConsole: boolean;
    public alert: ScheduledFieldInfo;
    public status: ScheduledFieldInfo;
    public callInstructions: string;
    public longDistanceCode: string;
    public phoneTeam: string;

    public constructor(init?: Partial<EditContact>) { (Object as any).assign(this, init); }
}

export enum SetupFeeTypes
{
    Percentage = 'Percentage',
    Flat = 'Flat',
}

export class ServiceMultiLevelRateInfo
{
    public _DisplayName: string;
    public quantity: number;
    public unitCost: number;
    public isFixedCost: boolean;

    public constructor(init?: Partial<ServiceMultiLevelRateInfo>) { (Object as any).assign(this, init); }
}

export class ServiceRateInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public serviceId: string;
    public serviceName: string;
    public unitCost: number;
    public setupFee: number;
    public setupFeeType: SetupFeeTypes;
    public level1Pricing: ServiceMultiLevelRateInfo;
    public level2Pricing: ServiceMultiLevelRateInfo;
    public level3Pricing: ServiceMultiLevelRateInfo;

    public constructor(init?: Partial<ServiceRateInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ServiceAllowanceInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public serviceId: string;
    public serviceName: string;
    public amount: number;
    public description: string;
    public applyTo: AllowanceApplications;

    public constructor(init?: Partial<ServiceAllowanceInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ContractFixedChargeInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public serviceId: string;
    public serviceName: string;
    public cost: number;
    public description: string;

    public constructor(init?: Partial<ContractFixedChargeInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ContractInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public masterId: string;
    public masterName: string;
    public overrideAllowances: boolean;
    public rates: ServiceRateInfo[];
    public allowances: ServiceAllowanceInfo[];
    public fixedCharges: ContractFixedChargeInfo[];

    public constructor(init?: Partial<ContractInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditContract
{
    public name: string;
    public centerId: string;
    public masterId: string;
    public overrideAllowances: boolean;
    public rates: ServiceRateInfo[];
    public allowances: ServiceAllowanceInfo[];
    public fixedCharges: ContractFixedChargeInfo[];

    public constructor(init?: Partial<EditContract>) { (Object as any).assign(this, init); }
}

export class DepartmentInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;

    public constructor(init?: Partial<DepartmentInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditDepartment
{
    public name: string;
    public centerId: string;

    public constructor(init?: Partial<EditDepartment>) { (Object as any).assign(this, init); }
}

export class ComposeEmailAddressInfo
{
    public address: string;

    public constructor(init?: Partial<ComposeEmailAddressInfo>) { (Object as any).assign(this, init); }
}

export enum EmailMessageStatuses
{
    Draft = 'Draft',
    NotSentYet = 'NotSentYet',
    Sent = 'Sent',
    NotRead = 'NotRead',
    Read = 'Read',
    Error = 'Error',
}

export class CompleteFormValue
{
    public fieldName: string;
    public fieldValue: string;

    public constructor(init?: Partial<CompleteFormValue>) { (Object as any).assign(this, init); }
}

export enum AIFormRoles
{
    None = 'None',
    TakeMessage = 'TakeMessage',
    Custom = 'Custom',
}

export class FormInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public clientId: string;
    public clientName: string;
    public showForAllClients: boolean;
    public enableGhl: boolean;
    public contactId: string;
    public contactName: string;
    public billAsServiceId: string;
    public billAsServiceName: string;
    public emailSubject: string;
    public doNotIncludeCallerNumber: boolean;
    public fields: FormFieldInfo[];
    public instructions: string;
    public clientCategoriesIds: string[];
    public clientCategoriesNames: string[];
    public aiRole: AIFormRoles;
    public aiPurpose: string;

    public constructor(init?: Partial<FormInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditForm
{
    public name: string;
    public centerId: string;
    public clientId: string;
    public showForAllClients: boolean;
    public enableGhl: boolean;
    public contactId: string;
    public billAsServiceId: string;
    public emailSubject: string;
    public doNotIncludeCallerNumber: boolean;
    public fields: FormFieldInfo[];
    public instructions: string;
    public clientCategoriesIds: string[];
    public aiRole: AIFormRoles;
    public aiPurpose: string;

    public constructor(init?: Partial<EditForm>) { (Object as any).assign(this, init); }
}

export class IndustryInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;

    public constructor(init?: Partial<IndustryInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditIndustry
{
    public name: string;
    public centerId: string;

    public constructor(init?: Partial<EditIndustry>) { (Object as any).assign(this, init); }
}

export enum IntegrationTypes
{
    NotSpecified = 'NotSpecified',
    OfficeRnD = 'OfficeRnD',
    GCalMeetingRoomSync = 'GCalMeetingRoomSync',
    GoHighLevel = 'GoHighLevel',
}

export enum GoHighLevelIntegrationType
{
    MatchClientByEmail = 'MatchClientByEmail',
    MatchClientByPhoneNumber = 'MatchClientByPhoneNumber',
    MatchByEitherPhoneOrEmail = 'MatchByEitherPhoneOrEmail',
    MatchByBothEmailAndPhone = 'MatchByBothEmailAndPhone',
}

export class OfficeRndIntegrationSettingsInfo
{
    public _DisplayName: string;
    public clientId: string;
    public clientSecret: string;
    public orgSlug: string;
    public extraPhoneNumberProperties: string;

    public constructor(init?: Partial<OfficeRndIntegrationSettingsInfo>) { (Object as any).assign(this, init); }
}

export class GoHighLevelIntegrationSettingsInfo
{
    public _DisplayName: string;
    public enableGoHighLevel: boolean;

    public constructor(init?: Partial<GoHighLevelIntegrationSettingsInfo>) { (Object as any).assign(this, init); }
}

export class GCalMeetingRoomSyncSettingsInfo
{
    public _DisplayName: string;
    public meetingRoomId: string;
    public meetingRoomName: string;
    public calendarId: string;
    public isAuthenticated: boolean;

    public constructor(init?: Partial<GCalMeetingRoomSyncSettingsInfo>) { (Object as any).assign(this, init); }
}

export class IntegrationInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public type: IntegrationTypes;
    public ghlType: GoHighLevelIntegrationType;
    public officeRnD: OfficeRndIntegrationSettingsInfo;
    public goHighLevel: GoHighLevelIntegrationSettingsInfo;
    public gCalMeetingRoomSync: GCalMeetingRoomSyncSettingsInfo;
    public notifyEmailAddresses: string;

    public constructor(init?: Partial<IntegrationInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditIntegration
{
    public name: string;
    public centerId: string;
    public type: IntegrationTypes;
    public ghlType: GoHighLevelIntegrationType;
    public officeRnD: OfficeRndIntegrationSettingsInfo;
    public goHighLevel: GoHighLevelIntegrationSettingsInfo;
    public gCalMeetingRoomSync: GCalMeetingRoomSyncSettingsInfo;
    public notifyEmailAddresses: string;

    public constructor(init?: Partial<EditIntegration>) { (Object as any).assign(this, init); }
}

export class LeadInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public firstName: string;
    public lastName: string;
    public companyName: string;
    public title: string;
    public centerId: string;
    public centerName: string;
    public primaryEmailAddress: string;
    public secondaryEmailAddress: string;
    public phone: string;
    public mobilePhone: string;
    public homePhone: string;
    public workPhone: string;
    public notes: string;
    public webSite: string;
    public faxNumber: string;
    public needsFollowup: boolean;
    public followupText: string;
    public responsibilityId: string;
    public responsibilityName: string;
    public departmentId: string;
    public departmentName: string;
    public industryId: string;
    public industryName: string;
    public relationshipId: string;
    public relationshipName: string;
    public address: AddressInfo;
    public sourceId: string;
    public sourceName: string;
    public stageId: string;
    public stageName: string;

    public constructor(init?: Partial<LeadInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditLead
{
    public firstName: string;
    public lastName: string;
    public companyName: string;
    public title: string;
    public centerId: string;
    public primaryEmailAddress: string;
    public secondaryEmailAddress: string;
    public phone: string;
    public mobilePhone: string;
    public homePhone: string;
    public workPhone: string;
    public notes: string;
    public webSite: string;
    public faxNumber: string;
    public needsFollowup: boolean;
    public followupText: string;
    public responsibilityId: string;
    public departmentId: string;
    public industryId: string;
    public relationshipId: string;
    public address: AddressInfo;
    public sourceId: string;
    public stageId: string;

    public constructor(init?: Partial<EditLead>) { (Object as any).assign(this, init); }
}

export class LeadSourceInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public contact: string;
    public phoneNumber: string;
    public emailAddress: string;
    public webSite: string;

    public constructor(init?: Partial<LeadSourceInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditLeadSource
{
    public name: string;
    public centerId: string;
    public contact: string;
    public phoneNumber: string;
    public emailAddress: string;
    public webSite: string;

    public constructor(init?: Partial<EditLeadSource>) { (Object as any).assign(this, init); }
}

export class LeadStageInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;

    public constructor(init?: Partial<LeadStageInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditLeadStage
{
    public name: string;
    public centerId: string;

    public constructor(init?: Partial<EditLeadStage>) { (Object as any).assign(this, init); }
}

export enum MeetingRoomVisibility
{
    Everyone = 'Everyone',
    InternalUseOnly = 'InternalUseOnly',
    ReadOnlyExternal = 'ReadOnlyExternal',
}

export enum TimedUnitSizeTypes
{
    Minutes = 'Minutes',
    Hours = 'Hours',
    FlatRate = 'FlatRate',
}

export enum RoundingTypes
{
    DoNotRound = 'DoNotRound',
    RoundUp = 'RoundUp',
    RoundDown = 'RoundDown',
}

export class TimedUnitSizeInfo
{
    public _DisplayName: string;
    public quantity: number;
    public type: TimedUnitSizeTypes;
    public round: RoundingTypes;

    public constructor(init?: Partial<TimedUnitSizeInfo>) { (Object as any).assign(this, init); }
}

export class MeetingRoomInfo extends EntityInfo
{
    public picturesIds: string[];
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public internalName: string;
    public description: string;
    public availableResourcesIds: string[];
    public availableResourcesNames: string[];
    public capacity: number;
    public visibility: MeetingRoomVisibility;
    public minBookingDuration: number;
    public teardownDuration: number;
    public schedulingNotice: string;
    public doubleBookingPolicy: DoubleBookingPolicy;
    public maxConcurrentBookings: number;
    public overrideCenterHours: boolean;
    public excludeFromEcom: boolean;
    public billAsServiceId: string;
    public billAsServiceName: string;
    public billableUnitSize: TimedUnitSizeInfo;
    public availability: CenterAvailabilityInfo;
    public categoriesIds: string[];
    public categoriesNames: string[];
    public compositeMeetingRoomsIds: string[];
    public compositeMeetingRoomsNames: string[];
    public orderInScheduler: number;
    public customFields: CustomFieldInfo[];

    public constructor(init?: Partial<MeetingRoomInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditMeetingRoom
{
    public name: string;
    public centerId: string;
    public internalName: string;
    public description: string;
    public availableResourcesIds: string[];
    public capacity: number;
    public visibility: MeetingRoomVisibility;
    public minBookingDuration: number;
    public teardownDuration: number;
    public schedulingNotice: string;
    public doubleBookingPolicy: DoubleBookingPolicy;
    public maxConcurrentBookings: number;
    public overrideCenterHours: boolean;
    public excludeFromEcom: boolean;
    public billAsServiceId: string;
    public billableUnitSize: TimedUnitSizeInfo;
    public availability: CenterAvailabilityInfo;
    public categoriesIds: string[];
    public compositeMeetingRoomsIds: string[];
    public orderInScheduler: number;
    public customFields: CustomFieldInfo[];

    public constructor(init?: Partial<EditMeetingRoom>) { (Object as any).assign(this, init); }
}

export enum StandaloneServerIndex
{
    MainServer = 'MainServer',
    SecondServer = 'SecondServer',
    ThirdServer = 'ThirdServer',
    FourthServer = 'FourthServer',
}

export enum ProviderTypes
{
    Demo = 'Demo',
    Avaya = 'Avaya',
    SiemensCsta = 'SiemensCsta',
    M5Csta = 'M5Csta',
    Intertel = 'Intertel',
    Mitel = 'Mitel',
    Snom = 'Snom',
    CiscoCallManager = 'CiscoCallManager',
    Voiss = 'Voiss',
    Broadsoft = 'Broadsoft',
    Shoretel = 'Shoretel',
    Remote = 'Remote',
    AvayaIPOffice = 'AvayaIPOffice',
    BroadsoftXsi = 'BroadsoftXsi',
    Yealink = 'Yealink',
    BroadsoftCti = 'BroadsoftCti',
    CiscoCME = 'CiscoCME',
    NecUniverge = 'NecUniverge',
    Polycom = 'Polycom',
    ShoretelTAPI = 'ShoretelTAPI',
    Voice = 'Voice',
    MitelLegacy = 'MitelLegacy',
    WebRTC = 'WebRTC',
}

export enum ConnectionTypes
{
    Default = 'Default',
    TcpIp = 'TcpIp',
    Serial = 'Serial',
}

export class ProviderSettingsInfo
{
    public _DisplayName: string;
    public providerType: ProviderTypes;
    public connectionType: ConnectionTypes;
    public ipAddress: string;
    public secondaryIPAddress: string;
    public bindToIPAddress: string;
    public connectionName: string;
    public serviceProviderId: string;
    public groupId: string;
    public userName: string;
    public password: string;
    public monitorAllDevices: boolean;
    public port: number;
    public enableCDRFeed: boolean;
    public linkedServer: string;
    public extraSettings: string;
    public voicemailExtension: string;
    public parkedCallTimeout: number;
    public simulateMissedCalls: boolean;
    public customerId: string;
    public phoneSystemId: string;

    public constructor(init?: Partial<ProviderSettingsInfo>) { (Object as any).assign(this, init); }
}

export enum PhoneTypes
{
    Console = 'Console',
    Client = 'Client',
    Park = 'Park',
}

export enum SnomFirmwareVersions
{
    v87OrLower = 'v87OrLower',
    v873 = 'v873',
    v874 = 'v874',
}

export class DeviceSettingsInfo
{
    public _DisplayName: string;
    public id: string;
    public disabled: boolean;
    public name: string;
    public number: string;
    public ipAddress: string;
    public port: number;
    public userName: string;
    public password: string;
    public phoneType: PhoneTypes;
    public monitorPresence: boolean;
    public location: string;
    public blindTransferDelay: number;
    public sepAddress: string;
    public snomFirmware: SnomFirmwareVersions;
    public additionalLines: string;
    public outboundServer: string;
    public server: string;

    public constructor(init?: Partial<DeviceSettingsInfo>) { (Object as any).assign(this, init); }
}

export class ScreenPopSettingsInfo
{
    public _DisplayName: string;
    public includeCallerNameInSearch: boolean;
    public includeCallerNumberInSearch: boolean;
    public includeTrunkInSearch: boolean;
    public includeRawMessageInSearch: boolean;
    public delimiter: string;
    public pattern: string;

    public constructor(init?: Partial<ScreenPopSettingsInfo>) { (Object as any).assign(this, init); }
}

export enum SharedCallVisibility
{
    Always = 'Always',
    OnHold = 'OnHold',
    Never = 'Never',
}

export class DialingRuleOverrideInfo
{
    public _DisplayName: string;
    public dialingRuleName: string;
    public template: string;

    public constructor(init?: Partial<DialingRuleOverrideInfo>) { (Object as any).assign(this, init); }
}

export enum CallBoxDurationStyles
{
    TotalDurationOfCall = 'TotalDurationOfCall',
    DurationInCurrentState = 'DurationInCurrentState',
    DurationAndTimesInCurrentState = 'DurationAndTimesInCurrentState',
    TotalDurationAndTimesInCurrentState = 'TotalDurationAndTimesInCurrentState',
}

export enum HudDisplayTypes
{
    Disabled = 'Disabled',
    OnByDefault = 'OnByDefault',
    OffByDefault = 'OffByDefault',
}

export enum TabLocations
{
    Default = 'Default',
    Right = 'Right',
}

export class CustomerPhoneSystemSettingsInfo
{
    public _DisplayName: string;
    public delayedClear: boolean;
    public externalCallsPrefix: string;
    public numberOfCallAppearances: number;
    public playRingOnIncomingCall: boolean;
    public showAllPhoneNumbersOnToolbar: boolean;
    public simulateBlindTransferInternal: boolean;
    public simulateBlindTransferExternal: boolean;
    public providerHandlesSimulatedTransfer: boolean;
    public providerSettings: ProviderSettingsInfo;
    public deviceSettings: DeviceSettingsInfo[];
    public screenPopSettings: ScreenPopSettingsInfo;
    public showShortcutsOnToolbar: boolean;
    public showPhoneNumbersNextToLinks: boolean;
    public showWindowOnScreenPop: boolean;
    public clearScreenOnHangup: boolean;
    public doNotClearScreenOnHangupOutgoing: boolean;
    public automaticallyShiftCallBoxes: boolean;
    public enableCallCenterFeatures: boolean;
    public sharedCallVisibility: SharedCallVisibility;
    public commaPauseDuration: number;
    public numberPadSendsDTMF: boolean;
    public showDispositionsAfterCall: boolean;
    public identifyCallersFromDatabase: boolean;
    public showLineInfoOnCallBox: boolean;
    public clickPhoneNumberToConnectCalls: boolean;
    public automaticallyActivateTabs: boolean;
    public indicateMyCallsOnBoxes: boolean;
    public showTimeInCurrentStateOnCallBox: boolean;
    public clickWholeBoxToActivateCall: boolean;
    public showClientLocalTimeInGreeting: boolean;
    public useBrowserAlertToPopWindow: boolean;
    public showNotificationWhenEmailReceived: boolean;
    public showClientReservationsInConsole: boolean;
    public allowPartialMatchOnScreenPops: boolean;
    public hideAlertInAssociatesList: boolean;
    public hideScreenPopsInConsole: boolean;
    public flashCallBoxHoldDurationSecs: number;
    public flashCallBoxHoldColor: string;
    public flashCallBoxRingDurationSecs: number;
    public flashCallBoxRingColor: string;
    public showScreenPopInCallBox: boolean;
    public enableCallersDatabase: boolean;
    public dialingRuleOverrides: DialingRuleOverrideInfo[];
    public ringtoneUrl: string;
    public increaseSizeOfAnswerButton: boolean;
    public restrictDevicesInConsoleToAuthenticatedUser: boolean;
    public callBoxDurationStyle: CallBoxDurationStyles;
    public hudDisplay: HudDisplayTypes;
    public associateListOrder: AssociateListOrder;
    public tabLocation: TabLocations;

    public constructor(init?: Partial<CustomerPhoneSystemSettingsInfo>) { (Object as any).assign(this, init); }
}

export class PhoneSystemInfoInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public runOnServerId: string;
    public runOnServerName: string;
    public remoteOnly: boolean;
    public timeZoneId: string;
    public runOnServerIndex: StandaloneServerIndex;
    public centersIds: string[];
    public centersNames: string[];
    public defaultClientId: string;
    public defaultClientName: string;
    public inactive: boolean;
    public settings: CustomerPhoneSystemSettingsInfo;

    public constructor(init?: Partial<PhoneSystemInfoInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditPhoneSystemInfo
{
    public name: string;
    public runOnServerId: string;
    public remoteOnly: boolean;
    public timeZoneId: string;
    public runOnServerIndex: StandaloneServerIndex;
    public centersIds: string[];
    public defaultClientId: string;
    public inactive: boolean;
    public settings: CustomerPhoneSystemSettingsInfo;

    public constructor(init?: Partial<EditPhoneSystemInfo>) { (Object as any).assign(this, init); }
}

export enum LoginTypes
{
    None = 'None',
    TeamMember = 'TeamMember',
    Administrator = 'Administrator',
    Client = 'Client',
}

export enum CoreModules
{
    Administrator = 'Administrator',
    Centers = 'Centers',
    Clients = 'Clients',
    Contacts = 'Contacts',
    MeetingRooms = 'MeetingRooms',
    Resources = 'Resources',
    Appointments = 'Appointments',
    Sales = 'Sales',
    Tickets = 'Tickets',
    Email = 'Email',
    Reports = 'Reports',
    Documents = 'Documents',
    CallRecords = 'CallRecords',
    Reservations = 'Reservations',
    Services = 'Services',
    Billing = 'Billing',
    Phones = 'Phones',
    Scheduler = 'Scheduler',
    Users = 'Users',
    Console = 'Console',
    Chat = 'Chat',
    Tasks = 'Tasks',
    Wiki = 'Wiki',
    Integration = 'Integration',
    Workflows = 'Workflows',
    Invoices = 'Invoices',
    Forms = 'Forms',
    Dashboard = 'Dashboard',
    Forums = 'Forums',
    WebServices = 'WebServices',
    ReceptionCalls = 'ReceptionCalls',
    EvoVoice = 'EvoVoice',
}

export enum ProductTypes
{
    MeetingRoom = 'MeetingRoom',
    Resource = 'Resource',
    Product = 'Product',
}

export class ListProductsTag
{
    public id: string;
    public name: string;
    public description: string;

    public constructor(init?: Partial<ListProductsTag>) { (Object as any).assign(this, init); }
}

export class ListProductsProduct
{
    public id: string;
    public type: ProductTypes;
    public name: string;
    public centerId: string;
    public serviceId: string;
    public metaServiceId: string;
    public memberUnitCost: number;
    public nonMemberUnitCost: number;
    public unitSize: TimedUnitSizeInfo;
    public tags: ListProductsTag[];
    public addOns: ListProductsProduct[];
    public errors: string[];
    public description: string;

    public constructor(init?: Partial<ListProductsProduct>) { (Object as any).assign(this, init); }
}

export enum Permissions
{
    Everything = 'Everything',
    View = 'View',
    Create = 'Create',
    Update = 'Update',
    BulkUpdate = 'BulkUpdate',
    Archive = 'Archive',
    Delete = 'Delete',
    DeleteForever = 'DeleteForever',
    Restore = 'Restore',
    Tag = 'Tag',
    BypassApproval = 'BypassApproval',
    Approve = 'Approve',
    Cancel = 'Cancel',
    CancelOwn = 'CancelOwn',
    Deny = 'Deny',
    DoubleBook = 'DoubleBook',
    Close = 'Close',
    ModifyCosts = 'ModifyCosts',
    ModifyBillingSettings = 'ModifyBillingSettings',
}

export class ModulePermissions
{
    public module: CoreModules;
    public permissions: Permissions[];

    public constructor(init?: Partial<ModulePermissions>) { (Object as any).assign(this, init); }
}

export class CallPartyInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public number: string;

    public constructor(init?: Partial<CallPartyInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum CallTypes
{
    Voice = 'Voice',
    Text = 'Text',
    AI = 'AI',
}

export enum ReceptionCallTypes
{
    Incoming = 'Incoming',
    Outgoing = 'Outgoing',
    Transfer = 'Transfer',
}

export enum CallEnder
{
    Unknown = 'Unknown',
    Operator = 'Operator',
    OtherParty = 'OtherParty',
}

export enum ReceptionCallInteractionTypes
{
    Answer = 'Answer',
    Hangup = 'Hangup',
    Hold = 'Hold',
    Retrieved = 'Retrieved',
    TransferAttempt = 'TransferAttempt',
    TransferCompleted = 'TransferCompleted',
    TransferStopped = 'TransferStopped',
}

export class ReceptionCallInteractionInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public performedById: string;
    public performedByName: string;
    public type: ReceptionCallInteractionTypes;
    public datePerformed: string;
    public description: string;

    public constructor(init?: Partial<ReceptionCallInteractionInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ReceptionCallMessageInfo
{
    public _DisplayName: string;
    public dateSent: string;
    public from: CallPartyInfo;
    public text: string;
    public sentiment: number;

    public constructor(init?: Partial<ReceptionCallMessageInfo>) { (Object as any).assign(this, init); }
}

export class ReceptionCallInsightInfo
{
    public _DisplayName: string;
    public insightId: string;
    public insightName: string;
    public data: string;
    public errorMessage: string;

    public constructor(init?: Partial<ReceptionCallInsightInfo>) { (Object as any).assign(this, init); }
}

export class TransferRecordingInfo
{
    public _DisplayName: string;
    public partyName: string;
    public recordingUrl: string;

    public constructor(init?: Partial<TransferRecordingInfo>) { (Object as any).assign(this, init); }
}

export enum ReceptionCallOutcomes
{
    None = 'None',
    TransferredInternal = 'TransferredInternal',
    TransferredExternal = 'TransferredExternal',
    TransferredVoicemail = 'TransferredVoicemail',
    MissedCall = 'MissedCall',
}

export enum ConsoleClients
{
    V2Console = 'V2Console',
    V3Console = 'V3Console',
}

export class ReceptionCallRecordInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public globalId: string;
    public callType: CallTypes;
    public phoneSystemId: string;
    public phoneSystemName: string;
    public startTime: string;
    public clientId: string;
    public clientName: string;
    public centerId: string;
    public centerName: string;
    public answerTime: string;
    public endTime: string;
    public duration: number;
    public timeToAnswer: number;
    public holdTime: number;
    public holdCount: number;
    public ringTime: number;
    public workTime: number;
    public talkTime: number;
    public transferTime: number;
    public clientCategoriesIds: string[];
    public clientCategoriesNames: string[];
    public callDispositionsIds: string[];
    public callDispositionsNames: string[];
    public type: ReceptionCallTypes;
    public endedBy: CallEnder;
    public caller: CallPartyInfo;
    public called: CallPartyInfo;
    public answeredBy: CallPartyInfo;
    public finishedBy: CallPartyInfo;
    public transferredTo: CallPartyInfo;
    public transferred: boolean;
    public lineNumber: string;
    public interactions: ReceptionCallInteractionInfo[];
    public messages: ReceptionCallMessageInfo[];
    public insights: ReceptionCallInsightInfo[];
    public callRecordingUrl: string;
    public transferRecordingUrls: TransferRecordingInfo[];
    public operatorSentiment: CallPartySentimentInfo;
    public callerSentiment: CallPartySentimentInfo;
    public answered: boolean;
    public outcome: ReceptionCallOutcomes;
    public notes: string;
    public server: string;
    public flagged: boolean;
    public flagNotes: string;
    public formsIds: string[];
    public formsNames: string[];
    public screenPop: string;
    public consoleClient: ConsoleClients;

    public constructor(init?: Partial<ReceptionCallRecordInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditReceptionCallRecord
{
    public globalId: string;
    public callType: CallTypes;
    public phoneSystemId: string;
    public startTime: string;
    public clientId: string;
    public centerId: string;
    public answerTime: string;
    public endTime: string;
    public duration: number;
    public timeToAnswer: number;
    public holdTime: number;
    public holdCount: number;
    public ringTime: number;
    public workTime: number;
    public transferTime: number;
    public clientCategoriesIds: string[];
    public callDispositionsIds: string[];
    public type: ReceptionCallTypes;
    public endedBy: CallEnder;
    public caller: CallPartyInfo;
    public called: CallPartyInfo;
    public answeredBy: CallPartyInfo;
    public finishedBy: CallPartyInfo;
    public transferredTo: CallPartyInfo;
    public transferred: boolean;
    public lineNumber: string;
    public interactions: ReceptionCallInteractionInfo[];
    public messages: ReceptionCallMessageInfo[];
    public insights: ReceptionCallInsightInfo[];
    public callRecordingUrl: string;
    public transferRecordingUrls: TransferRecordingInfo[];
    public operatorSentiment: CallPartySentimentInfo;
    public callerSentiment: CallPartySentimentInfo;
    public answered: boolean;
    public outcome: ReceptionCallOutcomes;
    public notes: string;
    public server: string;
    public flagged: boolean;
    public flagNotes: string;
    public formsIds: string[];
    public screenPop: string;
    public consoleClient: ConsoleClients;

    public constructor(init?: Partial<EditReceptionCallRecord>) { (Object as any).assign(this, init); }
}

export class RelationshipInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;

    public constructor(init?: Partial<RelationshipInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditRelationship
{
    public name: string;
    public centerId: string;

    public constructor(init?: Partial<EditRelationship>) { (Object as any).assign(this, init); }
}

export class RemoteServerInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public timeZoneId: string;
    public syncPassword: string;
    public ipAddress: string;
    public centersIds: string[];
    public centersNames: string[];
    public consoleUrlOverride: string;

    public constructor(init?: Partial<RemoteServerInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditRemoteServer
{
    public name: string;
    public timeZoneId: string;
    public syncPassword: string;
    public ipAddress: string;
    public centersIds: string[];
    public consoleUrlOverride: string;

    public constructor(init?: Partial<EditRemoteServer>) { (Object as any).assign(this, init); }
}

export enum ReportFormats
{
    Pdf = 'Pdf',
    Xlsx = 'Xlsx',
    Json = 'Json',
}

export class ReportRequestBase
{
    public format: ReportFormats;

    public constructor(init?: Partial<ReportRequestBase>) { (Object as any).assign(this, init); }
}

export enum ReportCallTypes
{
    All = 'All',
    Incoming = 'Incoming',
    Outgoing = 'Outgoing',
}

export enum CallRounding
{
    None = 'None',
    NextMinute = 'NextMinute',
    Next30Seconds = 'Next30Seconds',
}

export enum BillableTimeSources
{
    RingTime = 'RingTime',
    TalkTime = 'TalkTime',
    TransferTime = 'TransferTime',
    HoldTime = 'HoldTime',
    WorkTime = 'WorkTime',
}

export enum CallAllowanceReportTypeFilters
{
    NumMinutesOnly = 'NumMinutesOnly',
    NumCallsOnly = 'NumCallsOnly',
}

export enum CallInsightGrouping
{
    Agent = 'Agent',
    Center = 'Center',
}

export enum CallRecordSorting
{
    OldestFirst = 'OldestFirst',
    NewestFirst = 'NewestFirst',
    LongestFirst = 'LongestFirst',
    ShortestFirst = 'ShortestFirst',
    DialedNumber = 'DialedNumber',
    CallerId = 'CallerId',
    TransferredTo = 'TransferredTo',
}

export enum TimeSpanFormat
{
    HoursMinutesSeconds = 'HoursMinutesSeconds',
    MinutesWithDecimal = 'MinutesWithDecimal',
}

export enum OperatorStatisticsGrouping
{
    ByName = 'ByName',
    ByExtension = 'ByExtension',
    ByNameAndCenter = 'ByNameAndCenter',
    ByNameCenterAndExtension = 'ByNameCenterAndExtension',
}

export enum OperatorStatisticsCounting
{
    CallsAnswered = 'CallsAnswered',
    CallsFinished = 'CallsFinished',
}

export enum ClientReportDisplayModes
{
    ClientsAndContacts = 'ClientsAndContacts',
    ClientsOnly = 'ClientsOnly',
    ContactsOnly = 'ContactsOnly',
}

export enum ChargeSources
{
    Reservations = 'Reservations',
    Calls = 'Calls',
    ManualCharges = 'ManualCharges',
    MemorizedInvoices = 'MemorizedInvoices',
    MemorizedCharges = 'MemorizedCharges',
    CompletedForms = 'CompletedForms',
}

export enum LineItemDetailModes
{
    Summary = 'Summary',
    Detailed = 'Detailed',
}

export enum PaymentStatuses
{
    None = 'None',
    NotPaid = 'NotPaid',
    Paid = 'Paid',
    Cancelled = 'Cancelled',
    Charged = 'Charged',
    NoCharge = 'NoCharge',
    NonRefundable = 'NonRefundable',
    CardPunched = 'CardPunched',
}

export interface IUpdateReservation extends IUpdateEvent
{
    meetingRoomId: string;
    clientId: string;
    paymentStatus?: PaymentStatuses;
    numberOfAttendees?: number;
    adminNotes: string;
    organizer: AttendeeInfo;
    resourceIds: string[];
}

export class ResourceInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public description: string;
    public schedulingNotice: string;
    public doubleBookingPolicy: DoubleBookingPolicy;
    public quantityAvailable: number;
    public billAsServiceId: string;
    public billAsServiceName: string;
    public billableUnitSize: TimedUnitSizeInfo;
    public excludeFromEcom: boolean;

    public constructor(init?: Partial<ResourceInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditResource
{
    public name: string;
    public centerId: string;
    public description: string;
    public schedulingNotice: string;
    public doubleBookingPolicy: DoubleBookingPolicy;
    public quantityAvailable: number;
    public billAsServiceId: string;
    public billableUnitSize: TimedUnitSizeInfo;
    public excludeFromEcom: boolean;

    public constructor(init?: Partial<EditResource>) { (Object as any).assign(this, init); }
}

export class ResponsibilityInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;

    public constructor(init?: Partial<ResponsibilityInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditResponsibility
{
    public name: string;
    public centerId: string;

    public constructor(init?: Partial<EditResponsibility>) { (Object as any).assign(this, init); }
}

export enum AISessionChangeTypes
{
    Add = 'Add',
    Modify = 'Modify',
    Delete = 'Delete',
}

export enum SpecialServiceTypes
{
    None = 'None',
    CallCount = 'CallCount',
    CallMinutes = 'CallMinutes',
    IncomingCallCount = 'IncomingCallCount',
    OutgoingCallCount = 'OutgoingCallCount',
    IncomingCallMinutes = 'IncomingCallMinutes',
    OutgoingCallMinutes = 'OutgoingCallMinutes',
    Product = 'Product',
    AIMinutes = 'AIMinutes',
    AICall = 'AICall',
    AIChatMessage = 'AIChatMessage',
}

export class ServiceInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public description: string;
    public categoriesIds: string[];
    public categoriesNames: string[];
    public taxId: string;
    public taxName: string;
    public parentServiceId: string;
    public parentServiceName: string;
    public metaServiceId: string;
    public metaServiceName: string;
    public relatedServicesIds: string[];
    public relatedServicesNames: string[];
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public specialType: SpecialServiceTypes;
    public quantityAvailable: number;
    public code: string;
    public obscureChargeDescription: boolean;

    public constructor(init?: Partial<ServiceInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditService
{
    public name: string;
    public centerId: string;
    public description: string;
    public categoriesIds: string[];
    public taxId: string;
    public parentServiceId: string;
    public metaServiceId: string;
    public relatedServicesIds: string[];
    public thirdPartyInfo: ThirdPartyInformationInfo;
    public specialType: SpecialServiceTypes;
    public quantityAvailable: number;
    public code: string;
    public obscureChargeDescription: boolean;

    public constructor(init?: Partial<EditService>) { (Object as any).assign(this, init); }
}

export class ServiceAvailabilityItem
{
    public type: ProductTypes;
    public itemId: string;
    public itemName: string;
    public centerId: string;
    public centerName: string;
    public serviceId: string;
    public metaServiceId: string;
    public serviceName: string;

    public constructor(init?: Partial<ServiceAvailabilityItem>) { (Object as any).assign(this, init); }
}

export class SpeedDialInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public number: string;

    public constructor(init?: Partial<SpeedDialInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditSpeedDial
{
    public name: string;
    public centerId: string;
    public number: string;

    public constructor(init?: Partial<EditSpeedDial>) { (Object as any).assign(this, init); }
}

export class EmailSettingsInfo
{
    public _DisplayName: string;
    public emailUpdatesEnabled: boolean;
    public subjectToUpdateStatus: string;
    public subjectToUpdateAlert: string;
    public signature: string;
    public replyToAddress: string;
    public emailNotificationSubject: string;
    public serverType: EmailServerTypes;
    public incomingServer: EmailServerSettingsInfo;
    public outgoingServer: EmailServerSettingsInfo;
    public emailAddress: string;
    public emailAddressName: string;
    public runOnServerId: string;
    public runOnServerName: string;
    public sendFromHostedSuiteDotCom: boolean;
    public sendEmailImmediately: boolean;
    public emailAddressToNotifyOnFailure: string;

    public constructor(init?: Partial<EmailSettingsInfo>) { (Object as any).assign(this, init); }
}

export enum DialingRuleTypes
{
    Default = 'Default',
    Voicemail = 'Voicemail',
}

export enum DialingRuleTransferTypes
{
    Standard = 'Standard',
    DefaultBlind = 'DefaultBlind',
    AlwaysBlind = 'AlwaysBlind',
}

export class DialingRuleInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public template: string;
    public type: DialingRuleTypes;
    public transferType: DialingRuleTransferTypes;
    public ignoreExternalPrepend: boolean;
    public centerId: string;
    public centerName: string;

    public constructor(init?: Partial<DialingRuleInfo>) { super(init); (Object as any).assign(this, init); }
}

export enum SchedulerCenterListTypes
{
    CenterNames = 'CenterNames',
    GroupByState = 'GroupByState',
    Both = 'Both',
}

export class SchedulingSettingsInfo
{
    public _DisplayName: string;
    public disableDragInScheduler: boolean;
    public hideCancelledAndDeniedStatusesInScheduler: boolean;
    public centerListType: SchedulerCenterListTypes;
    public hidePaymentStatusField: boolean;
    public showInternalNameInScheduler: boolean;
    public showReservedByField: boolean;
    public timePickerIntervalMins: number;
    public reservedByOtherClientMessage: string;

    public constructor(init?: Partial<SchedulingSettingsInfo>) { (Object as any).assign(this, init); }
}

export class ConsoleSettingsInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public autoSelectFirstContactForForms: boolean;
    public twilioAccountSID: string;
    public twilioAuthToken: string;
    public twilioPhoneNumber: string;

    public constructor(init?: Partial<ConsoleSettingsInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ColorSchemeInfo
{
    public _DisplayName: string;
    public customColor1: string;
    public customColor2: string;
    public customColor3: string;

    public constructor(init?: Partial<ColorSchemeInfo>) { (Object as any).assign(this, init); }
}

export class BrandingSettingsInfo
{
    public _DisplayName: string;
    public consoleCss: string;
    public v3ConsoleCss: string;
    public globalCss: string;
    public loginCss: string;

    public constructor(init?: Partial<BrandingSettingsInfo>) { (Object as any).assign(this, init); }
}

export class SecuritySettingsInfo
{
    public _DisplayName: string;
    public failedLoginLockCount: number;

    public constructor(init?: Partial<SecuritySettingsInfo>) { (Object as any).assign(this, init); }
}

export enum BillingRateSources
{
    ContractRates = 'ContractRates',
    CenterAndClientRates = 'CenterAndClientRates',
}

export class BillingSettingsInfo
{
    public _DisplayName: string;
    public rateSource: BillingRateSources;
    public hidePaymentsOnInvoice: boolean;
    public enableBillingCycles: boolean;
    public alwaysRequireServiceOnCharge: boolean;
    public disableCostPreview: boolean;
    public chargeCutoffDay: number;
    public defaultCallAllowance: CallAllowanceInfo;

    public constructor(init?: Partial<BillingSettingsInfo>) { (Object as any).assign(this, init); }
}

export class GlobalSettingsInfo
{
    public _DisplayName: string;
    public defaultTimeZoneId: string;
    public defaultCulture: string;
    public excludedNotifications: NotificationTypes[];
    public syncClientCategoriesToContacts: boolean;

    public constructor(init?: Partial<GlobalSettingsInfo>) { (Object as any).assign(this, init); }
}

export class SystemSettingsInfo extends EntityInfo
{
    public logoId: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public email: EmailSettingsInfo;
    public dialingRules: DialingRuleInfo[];
    public scheduling: SchedulingSettingsInfo;
    public console: ConsoleSettingsInfo;
    public colorScheme: ColorSchemeInfo;
    public brandingSettings: BrandingSettingsInfo;
    public security: SecuritySettingsInfo;
    public billingSettings: BillingSettingsInfo;
    public global: GlobalSettingsInfo;

    public constructor(init?: Partial<SystemSettingsInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditSystemSettings
{
    public email: EmailSettingsInfo;
    public dialingRules: DialingRuleInfo[];
    public scheduling: SchedulingSettingsInfo;
    public console: ConsoleSettingsInfo;
    public colorScheme: ColorSchemeInfo;
    public brandingSettings: BrandingSettingsInfo;
    public security: SecuritySettingsInfo;
    public billingSettings: BillingSettingsInfo;
    public global: GlobalSettingsInfo;

    public constructor(init?: Partial<EditSystemSettings>) { (Object as any).assign(this, init); }
}

export enum TaxTypes
{
    Percentage = 'Percentage',
    Flat = 'Flat',
}

export class TaxInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public type: TaxTypes;
    public rate: number;

    public constructor(init?: Partial<TaxInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditTax
{
    public name: string;
    public type: TaxTypes;
    public rate: number;

    public constructor(init?: Partial<EditTax>) { (Object as any).assign(this, init); }
}

export class TeamMemberInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public centerId: string;
    public centerName: string;
    public firstName: string;
    public lastName: string;
    public phoneTeam: string;
    public userName: string;
    public password: string;
    public failedLoginAttempts: number;
    public loginDisabled: boolean;
    public userGroupId: string;
    public userGroupName: string;
    public emailAddress: string;
    public disableNotifications: boolean;

    public constructor(init?: Partial<TeamMemberInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditTeamMember
{
    public centerId: string;
    public firstName: string;
    public lastName: string;
    public phoneTeam: string;
    public userName: string;
    public password: string;
    public failedLoginAttempts: number;
    public loginDisabled: boolean;
    public userGroupId: string;
    public emailAddress: string;
    public disableNotifications: boolean;

    public constructor(init?: Partial<EditTeamMember>) { (Object as any).assign(this, init); }
}

export enum UserGroupTypes
{
    Team = 'Team',
    Client = 'Client',
    Any = 'Any',
}

export class UserGroupInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public type: UserGroupTypes;
    public roles: string[];
    public parentCenterId: string;
    public parentCenterName: string;
    public visibleCentersIds: string[];
    public visibleCentersNames: string[];
    public notifications: NotificationTypes[];
    public cancellationPolicy: CancellationPolicyInfo;
    public rescheduleWindowHours: number;
    public minBookingDurationOverride: number;
    public visibleMeetingRoomCategoriesIds: string[];
    public visibleMeetingRoomCategoriesNames: string[];

    public constructor(init?: Partial<UserGroupInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditUserGroup
{
    public name: string;
    public type: UserGroupTypes;
    public roles: string[];
    public parentCenterId: string;
    public visibleCentersIds: string[];
    public notifications: NotificationTypes[];
    public cancellationPolicy: CancellationPolicyInfo;
    public rescheduleWindowHours: number;
    public minBookingDurationOverride: number;
    public visibleMeetingRoomCategoriesIds: string[];

    public constructor(init?: Partial<EditUserGroup>) { (Object as any).assign(this, init); }
}

export enum WebhookEvents
{
    ClientCreated = 'ClientCreated',
    ClientUpdated = 'ClientUpdated',
    ClientArchived = 'ClientArchived',
    ReservationScheduled = 'ReservationScheduled',
    ReservationUpdated = 'ReservationUpdated',
    ReservationCancelled = 'ReservationCancelled',
    ReservationDeleted = 'ReservationDeleted',
    ContactCreated = 'ContactCreated',
    ContactUpdated = 'ContactUpdated',
    ContactArchived = 'ContactArchived',
}

export enum WebhookAuthentication
{
    None = 'None',
    Basic = 'Basic',
    Bearer = 'Bearer',
}

export class WebhookInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public disabled: boolean;
    public notes: string;
    public events: WebhookEvents[];
    public centersIds: string[];
    public centersNames: string[];
    public url: string;
    public httpMethod: string;
    public authentication: WebhookAuthentication;
    public userName: string;
    public password: string;

    public constructor(init?: Partial<WebhookInfo>) { super(init); (Object as any).assign(this, init); }
}

export class EditWebhook
{
    public disabled: boolean;
    public notes: string;
    public events: WebhookEvents[];
    public centersIds: string[];
    public url: string;
    public httpMethod: string;
    public authentication: WebhookAuthentication;
    public userName: string;
    public password: string;

    public constructor(init?: Partial<EditWebhook>) { (Object as any).assign(this, init); }
}

export enum WebhookCallStatuses
{
    Attempting = 'Attempting',
    Success = 'Success',
    Error = 'Error',
}

export class WebhookAttemptInfo
{
    public _DisplayName: string;
    public date: string;
    public responseStatus: string;
    public responseMessage: string;

    public constructor(init?: Partial<WebhookAttemptInfo>) { (Object as any).assign(this, init); }
}

export class RoleInfo
{
    public name: string;
    public userGroupType: UserGroupTypes;
    public description: string;
    public typeName: string;

    public constructor(init?: Partial<RoleInfo>) { (Object as any).assign(this, init); }
}

export class ListResponse<T>
{
    /**
    * The items
    */
    // @ApiMember(Description="The items")
    public items: T[];

    /**
    * The total number of items
    */
    // @ApiMember(Description="The total number of items")
    public totalCount: number;

    /**
    * The total number of pages
    */
    // @ApiMember(Description="The total number of pages")
    public totalPages: number;

    public constructor(init?: Partial<ListResponse<T>>) { (Object as any).assign(this, init); }
}

export class AIBillingDataResult
{
    public clients: AIBillingClientData[];

    public constructor(init?: Partial<AIBillingDataResult>) { (Object as any).assign(this, init); }
}

export class GetAvailableAIBundlesResponse
{
    public bundles: CustomerAIBundleInfo[];

    public constructor(init?: Partial<GetAvailableAIBundlesResponse>) { (Object as any).assign(this, init); }
}

export class AIOnboardingInfo
{
    public isDevEnvironment: boolean;
    public clientName: string;
    public submittedAt: string;
    public confirmedAt: string;
    public plans: CustomerAIPlanInfo[];
    public timeZones: TimeZoneResponseInfo[];
    public planId: string;
    public hours: ClientAIOnboardingHours;
    public hoursDescription: string;
    public timeZoneId: string;
    public answerIfMissedByOperators: boolean;
    public phoneNumber: ClientAIOnboardingPhoneNumber;
    public phoneNumberRequest: string;
    public companyName: string;
    public locale: string;
    public voice: string;
    public tone: string;
    public name: string;
    public personality: string;
    public greeting: string;
    public knowledgeBaseSources: ClientAIKnowledgeBaseSourceInfo[];
    public specificKnowledge: string;
    public customWords: ClientAIWordInfo[];
    public callHandlingRequests: string;
    public specialRequests: string;
    public links: ClientAIOnboardingLinkInfo[];
    public contacts: ClientAIOnboardingContactInfo[];
    public forms: ClientAIOnboardingFormInfo[];

    public constructor(init?: Partial<AIOnboardingInfo>) { (Object as any).assign(this, init); }
}

export class GetAvailableAIPlansResponse
{
    public plans: CustomerAIPlanInfo[];

    public constructor(init?: Partial<GetAvailableAIPlansResponse>) { (Object as any).assign(this, init); }
}

export class GetActiveAIPlansResponse
{
    public queryDate: string;
    public plans: ActiveAIPlanInfo[];

    public constructor(init?: Partial<GetActiveAIPlansResponse>) { (Object as any).assign(this, init); }
}

export class AIPlanInfo
{
    public clientId: string;
    public clientName: string;
    public centerTimeZoneId: string;
    public renewalDay: number;
    public nextRenewalDate: string;
    public nextRenewalDateUtc: string;
    public isConfirmed: boolean;
    public isCancelled: boolean;
    public currentPlan: AIPlanHistoryInfo;
    public pendingChange: AIPlanHistoryInfo;
    public planHistory: AIPlanHistoryInfo[];
    public availablePlans: CustomerAIPlanInfo[];
    public activeBundles: ActiveBundleInfo[];
    public availableBundles: CustomerAIBundleInfo[];

    public constructor(init?: Partial<AIPlanInfo>) { (Object as any).assign(this, init); }
}

export class AIPlanUsageInfo
{
    public clientId: string;
    public clientName: string;
    public billingCycleStart: string;
    public billingCycleEnd: string;
    public planName: string;
    public includedMinutes: number;
    public monthlyCost: number;
    public additionalMinuteCost: number;
    public retailMonthlyCost: number;
    public retailAdditionalMinuteCost: number;
    public includedChats: number;
    public additionalChatCost: number;
    public retailAdditionalChatCost: number;
    public includedEmails: number;
    public additionalEmailCost: number;
    public retailAdditionalEmailCost: number;
    public bundleMinutes: number;
    public bundleChats: number;
    public bundleEmails: number;
    public bundleMonthlyCost: number;
    public activeBundles: ActiveBundleInfo[];
    public numberOfCalls: number;
    public totalUsedMinutes: number;
    public overageMinutes: number;
    public estimatedOverageCost: number;
    public hasActivePlan: boolean;
    public message: string;

    public constructor(init?: Partial<AIPlanUsageInfo>) { (Object as any).assign(this, init); }
}

export class AIUsageResult
{
    public usage: AIUsage[];

    public constructor(init?: Partial<AIUsageResult>) { (Object as any).assign(this, init); }
}

export class ListEventsResponse<TEvent>
{
    public events: TEvent[];

    public constructor(init?: Partial<ListEventsResponse<TEvent>>) { (Object as any).assign(this, init); }
}

export class AppointmentInfo extends EventInfo
{
    public calendarId: string;

    public constructor(init?: Partial<AppointmentInfo>) { super(init); (Object as any).assign(this, init); }
}

export class CallInsightCharts
{
    public stats: CallInsightStat[];
    public charts: CallInsightChart[];

    public constructor(init?: Partial<CallInsightCharts>) { (Object as any).assign(this, init); }
}

export class CallInsightResponse
{
    public data: string;
    public errorMessage: string;
    public operatorSentiment: CallPartySentimentInfo;
    public callerSentiment: CallPartySentimentInfo;
    public transcript: TranscriptLine[];

    public constructor(init?: Partial<CallInsightResponse>) { (Object as any).assign(this, init); }
}

export class UploadFileResponse
{
    public fileId: string;

    public constructor(init?: Partial<UploadFileResponse>) { (Object as any).assign(this, init); }
}

export class ClientKbSessionInfo
{
    public chatToken: string;

    public constructor(init?: Partial<ClientKbSessionInfo>) { (Object as any).assign(this, init); }
}

export class ClientKbChatTranscript
{
    public items: ClientKbChatMessage[];

    public constructor(init?: Partial<ClientKbChatTranscript>) { (Object as any).assign(this, init); }
}

export class TestClientKbResult
{
    public answer: string;

    public constructor(init?: Partial<TestClientKbResult>) { (Object as any).assign(this, init); }
}

export class ClientKbStatus
{
    public status: string;
    public content: ClientKbContent[];

    public constructor(init?: Partial<ClientKbStatus>) { (Object as any).assign(this, init); }
}

export class CompletedFormInfo extends EntityInfo
{
    public name: string;
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public dateCompleted: string;
    public formId: string;
    public formName: string;
    public clientId: string;
    public clientName: string;
    public contactId: string;
    public contactName: string;
    public contactsIds: string[];
    public contactsNames: string[];
    public emailSubject: string;
    public callerNumber: string;
    public fields: CompletedFormFieldInfo[];
    public callId: string;
    public callName: string;

    public constructor(init?: Partial<CompletedFormInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ConsolePopResponse
{
    public client: ClientInfo;
    public contacts: ContactInfo[];
    public contact: ContactInfo;
    public center: CenterInfo;
    public forms: FormInfo[];
    public templates: ClientTemplateInfo[];
    public screenPop: ConsoleScreenPopInfo;
    public chatSnippets: CustomerChatSnippetInfo[];
    public clientLocalTime: string;

    public constructor(init?: Partial<ConsolePopResponse>) { (Object as any).assign(this, init); }
}

export class GetClientContactInfoResponse
{
    public client: ClientInfo;
    public contact: ContactInfo;

    public constructor(init?: Partial<GetClientContactInfoResponse>) { (Object as any).assign(this, init); }
}

export class EmailMessageInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public status: EmailMessageStatuses;
    public subject: string;
    public centerId: string;
    public centerName: string;
    public dateReceived: string;
    public dateSent: string;
    public from: EmailAddressInfo;
    public to: EmailAddressInfo[];
    public bcc: EmailAddressInfo[];
    public cc: EmailAddressInfo[];
    public htmlBody: string;
    public errorMessage: string;

    public constructor(init?: Partial<EmailMessageInfo>) { super(init); (Object as any).assign(this, init); }
}

export class ListProductsResult
{
    public products: ListProductsProduct[];

    public constructor(init?: Partial<ListProductsResult>) { (Object as any).assign(this, init); }
}

export class AuthInfo
{
    public isAuthenticated: boolean;
    public userId: string;
    public userName: string;
    public name: string;
    public customerName: string;
    public centerId: string;
    public visibleCenterIds: string[];
    public roles: string[];
    public permissions: ModulePermissions[];
    public isAIEnabled: boolean;
    public hasAIPlans: boolean;
    public userCulture: string;
    public customerId: string;

    public constructor(init?: Partial<AuthInfo>) { (Object as any).assign(this, init); }
}

export class Config
{
    public jsUrl: string;

    public constructor(init?: Partial<Config>) { (Object as any).assign(this, init); }
}

export class ReceptionCallUsers
{
    public users: CallPartyInfo[];

    public constructor(init?: Partial<ReceptionCallUsers>) { (Object as any).assign(this, init); }
}

export class ReservationInfo extends EventInfo
{
    public meetingRoomId: string;
    public clientId: string;
    public clientName: string;
    public paymentStatus: PaymentStatuses;
    public type: AppointmentType;
    public numberOfAttendees: number;
    public adminNotes: string;
    public organizer: AttendeeInfo;
    public resourceIds: string[];
    public linkedToMeetingRoomId: string;
    public linkedToMeetingRoomName: string;

    public constructor(init?: Partial<ReservationInfo>) { super(init); (Object as any).assign(this, init); }
}

export class AISessionChangeInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public sessionId: string;
    public sessionName: string;
    public type: AISessionChangeTypes;
    public entityId: string;
    public entityType: string;
    public entityName: string;
    public changeDocument: string;

    public constructor(init?: Partial<AISessionChangeInfo>) { super(init); (Object as any).assign(this, init); }
}

export class GetServiceAvailabilityResponse
{
    public availableServices: ServiceAvailabilityItem[];

    public constructor(init?: Partial<GetServiceAvailabilityResponse>) { (Object as any).assign(this, init); }
}

export class WebhookCallInfo extends EntityInfo
{
    public dateCreated: string;
    public dateLastModified: string;
    public dateArchived: string;
    public archivedById: string;
    public archivedByName: string;
    public dateDeleted: string;
    public deletedById: string;
    public deletedByName: string;
    public lastModifiedById: string;
    public lastModifiedByName: string;
    public createdById: string;
    public createdByName: string;
    public webhookId: string;
    public webhookName: string;
    public event: WebhookEvents;
    public centerId: string;
    public entityId: string;
    public jsonBody: string;
    public status: WebhookCallStatuses;
    public message: string;
    public nextAttempt: string;
    public attempts: WebhookAttemptInfo[];

    public constructor(init?: Partial<WebhookCallInfo>) { super(init); (Object as any).assign(this, init); }
}

export class AppSettingsInfo
{
    public v3ConsoleCss: string;
    public global: GlobalSettingsInfo;

    public constructor(init?: Partial<AppSettingsInfo>) { (Object as any).assign(this, init); }
}

export class GetDialingRulesResponse
{
    public dialingRules: DialingRuleInfo[];
    public dedicatedSmsPhoneNumber: string;

    public constructor(init?: Partial<GetDialingRulesResponse>) { (Object as any).assign(this, init); }
}

export class ListRolesResponse
{
    public roles: RoleInfo[];

    public constructor(init?: Partial<ListRolesResponse>) { (Object as any).assign(this, init); }
}

export class ListTimeZonesResponse
{
    public timeZones: TimeZoneResponseInfo[];

    public constructor(init?: Partial<ListTimeZonesResponse>) { (Object as any).assign(this, init); }
}

// @Route("/administrators", "POST")
export class NewAdministrator extends EditAdministrator implements IReturn<AdministratorInfo>
{

    public constructor(init?: Partial<NewAdministrator>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AdministratorInfo(); }
    public getTypeName() { return 'NewAdministrator'; }
}

// @Route("/administrators/{id}", "PATCH")
export class PatchAdministrator extends EditAdministrator implements IReturn<AdministratorInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchAdministrator>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AdministratorInfo(); }
    public getTypeName() { return 'PatchAdministrator'; }
}

// @Route("/administrators/{id}", "DELETE")
export class DeleteAdministrator implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteAdministrator>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteAdministrator'; }
}

// @Route("/administrators/{id}", "GET")
export class GetAdministrator implements IReturn<AdministratorInfo>
{
    public id: string;

    public constructor(init?: Partial<GetAdministrator>) { (Object as any).assign(this, init); }
    public createResponse() { return new AdministratorInfo(); }
    public getTypeName() { return 'GetAdministrator'; }
}

// @Route("/administrators", "GET")
export class ListAdministrators extends ListEntitiesRequest<AdministratorInfo> implements IReturn<ListResponse<AdministratorInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public userName: string;
    public emailAddress: string;
    public firstName: string;
    public lastName: string;
    public centerId: string;

    public constructor(init?: Partial<ListAdministrators>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<AdministratorInfo>(); }
    public getTypeName() { return 'ListAdministrators'; }
}

// @Route("/ai/billing-data", "GET")
export class GetAIBillingData implements IReturn<AIBillingDataResult>
{
    /**
    * Filter to a specific customer/reseller
    */
    // @ApiMember(Description="Filter to a specific customer/reseller")
    public customerId: string;

    public constructor(init?: Partial<GetAIBillingData>) { (Object as any).assign(this, init); }
    public createResponse() { return new AIBillingDataResult(); }
    public getTypeName() { return 'GetAIBillingData'; }
}

// @Route("/ai-bundles", "GET")
export class GetAvailableAIBundles implements IReturn<GetAvailableAIBundlesResponse>
{

    public constructor(init?: Partial<GetAvailableAIBundles>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetAvailableAIBundlesResponse(); }
    public getTypeName() { return 'GetAvailableAIBundles'; }
}

// @Route("/clients/{ClientId}/ai-bundles/activate", "POST")
export class ActivateAIBundle implements IReturnVoid
{
    public clientId: string;
    public bundleId: string;

    public constructor(init?: Partial<ActivateAIBundle>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ActivateAIBundle'; }
}

// @Route("/clients/{ClientId}/ai-bundles/{AssignmentId}/deactivate", "POST")
export class DeactivateAIBundle implements IReturnVoid
{
    public clientId: string;
    public assignmentId: string;

    public constructor(init?: Partial<DeactivateAIBundle>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeactivateAIBundle'; }
}

// @Route("/clients/{ClientId}/ai-bundles/{AssignmentId}/deactivate-scheduled", "POST")
export class ScheduleDeactivateAIBundle implements IReturnVoid
{
    public clientId: string;
    public assignmentId: string;

    public constructor(init?: Partial<ScheduleDeactivateAIBundle>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ScheduleDeactivateAIBundle'; }
}

// @Route("/clients/{ClientId}/ai-bundles/{AssignmentId}/cancel-deactivation", "POST")
export class CancelBundleDeactivation implements IReturnVoid
{
    public clientId: string;
    public assignmentId: string;

    public constructor(init?: Partial<CancelBundleDeactivation>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'CancelBundleDeactivation'; }
}

// @Route("/clients/{clientId}/ai-onboarding", "GET")
export class GetAIOnboardingInfo implements IReturn<AIOnboardingInfo>
{
    public clientId: string;

    public constructor(init?: Partial<GetAIOnboardingInfo>) { (Object as any).assign(this, init); }
    public createResponse() { return new AIOnboardingInfo(); }
    public getTypeName() { return 'GetAIOnboardingInfo'; }
}

// @Route("/clients/{clientId}/ai-onboarding", "POST")
export class SaveAIOnboardingInfo implements IReturnVoid
{
    public clientId: string;
    public planId: string;
    public hours: ClientAIOnboardingHours;
    public hoursDescription: string;
    public timeZoneId: string;
    public answerIfMissedByOperators: boolean;
    public phoneNumber: ClientAIOnboardingPhoneNumber;
    public phoneNumberRequest: string;
    public submitToEvo: boolean;
    public companyName: string;
    public locale: string;
    public voice: string;
    public tone: string;
    public name: string;
    public personality: string;
    public greeting: string;
    public knowledgeBaseSources: ClientAIKnowledgeBaseSourceInfo[];
    public specificKnowledge: string;
    public customWords: ClientAIWordInfo[];
    public callHandlingRequests: string;
    public specialRequests: string;
    public links: ClientAIOnboardingLinkInfo[];
    public contacts: ClientAIOnboardingContactInfo[];
    public forms: ClientAIOnboardingFormInfo[];

    public constructor(init?: Partial<SaveAIOnboardingInfo>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'SaveAIOnboardingInfo'; }
}

// @Route("/clients/{clientId}/ai-onboarding/confirm", "POST")
export class ConfirmAIOnboarding implements IReturnVoid
{
    public clientId: string;

    public constructor(init?: Partial<ConfirmAIOnboarding>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ConfirmAIOnboarding'; }
}

// @Route("/ai-plans", "GET")
export class GetAvailableAIPlans implements IReturn<GetAvailableAIPlansResponse>
{

    public constructor(init?: Partial<GetAvailableAIPlans>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetAvailableAIPlansResponse(); }
    public getTypeName() { return 'GetAvailableAIPlans'; }
}

// @Route("/ai-plans/active", "GET")
export class GetActiveAIPlans implements IReturn<GetActiveAIPlansResponse>
{
    public date: string;

    public constructor(init?: Partial<GetActiveAIPlans>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetActiveAIPlansResponse(); }
    public getTypeName() { return 'GetActiveAIPlans'; }
}

// @Route("/clients/{clientId}/ai-plan", "GET")
export class GetAIPlan implements IReturn<AIPlanInfo>
{
    public clientId: string;

    public constructor(init?: Partial<GetAIPlan>) { (Object as any).assign(this, init); }
    public createResponse() { return new AIPlanInfo(); }
    public getTypeName() { return 'GetAIPlan'; }
}

// @Route("/clients/{clientId}/ai-plan/usage", "GET")
export class GetAIPlanUsage implements IReturn<AIPlanUsageInfo>
{
    public clientId: string;

    public constructor(init?: Partial<GetAIPlanUsage>) { (Object as any).assign(this, init); }
    public createResponse() { return new AIPlanUsageInfo(); }
    public getTypeName() { return 'GetAIPlanUsage'; }
}

// @Route("/clients/{clientId}/ai-plan/upgrade", "POST")
export class UpgradeAIPlan implements IReturnVoid
{
    public clientId: string;
    public newPlanId: string;

    public constructor(init?: Partial<UpgradeAIPlan>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'UpgradeAIPlan'; }
}

// @Route("/clients/{clientId}/ai-plan/downgrade", "POST")
export class DowngradeAIPlan implements IReturnVoid
{
    public clientId: string;
    public newPlanId: string;

    public constructor(init?: Partial<DowngradeAIPlan>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DowngradeAIPlan'; }
}

// @Route("/clients/{clientId}/ai-plan/pending", "DELETE")
export class CancelPendingAIPlanChange implements IReturnVoid
{
    public clientId: string;

    public constructor(init?: Partial<CancelPendingAIPlanChange>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'CancelPendingAIPlanChange'; }
}

// @Route("/clients/{clientId}/ai-plan/cancel", "POST")
export class CancelAIPlan implements IReturnVoid
{
    public clientId: string;

    public constructor(init?: Partial<CancelAIPlan>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'CancelAIPlan'; }
}

// @Route("/clients/{clientId}/ai-plan/cancel-scheduled", "POST")
export class ScheduleCancelAIPlan implements IReturnVoid
{
    public clientId: string;

    public constructor(init?: Partial<ScheduleCancelAIPlan>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ScheduleCancelAIPlan'; }
}

// @Route("/clients/{clientId}/ai-plan/activate", "POST")
export class ActivateAIPlan implements IReturnVoid
{
    public clientId: string;
    public planId: string;

    public constructor(init?: Partial<ActivateAIPlan>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ActivateAIPlan'; }
}

// @Route("/ai-sessions/{id}/changes", "POST")
export class ApplyAISessionChanges implements IReturnVoid
{
    public id: string;
    public changeId: string;

    public constructor(init?: Partial<ApplyAISessionChanges>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ApplyAISessionChanges'; }
}

// @Route("/ai-sessions/{id}/changes", "DELETE")
export class UndoAISessionChanges implements IReturnVoid
{
    public id: string;
    public changeId: string;

    public constructor(init?: Partial<UndoAISessionChanges>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'UndoAISessionChanges'; }
}

// @Route("/ai-sessions", "POST")
export class NewAISession extends EditAISession implements IReturn<AISessionInfo>
{

    public constructor(init?: Partial<NewAISession>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AISessionInfo(); }
    public getTypeName() { return 'NewAISession'; }
}

// @Route("/ai-sessions/{id}", "PATCH")
export class PatchAISession extends EditAISession implements IReturn<AISessionInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchAISession>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AISessionInfo(); }
    public getTypeName() { return 'PatchAISession'; }
}

// @Route("/ai-sessions/{id}", "DELETE")
export class DeleteAISession implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteAISession>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteAISession'; }
}

// @Route("/ai-sessions/{id}", "GET")
export class GetAISession implements IReturn<AISessionInfo>
{
    public id: string;

    public constructor(init?: Partial<GetAISession>) { (Object as any).assign(this, init); }
    public createResponse() { return new AISessionInfo(); }
    public getTypeName() { return 'GetAISession'; }
}

// @Route("/ai-sessions", "GET")
export class ListAISessions extends ListEntitiesRequest<AISessionInfo> implements IReturn<ListResponse<AISessionInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public purpose: string;

    public constructor(init?: Partial<ListAISessions>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<AISessionInfo>(); }
    public getTypeName() { return 'ListAISessions'; }
}

// @Route("/ai/usage", "GET")
export class GetAIUsage implements IReturn<AIUsageResult>
{
    /**
    * The start of the date range
    */
    // @ApiMember(Description="The start of the date range")
    // @Required()
    public startDate: string;

    /**
    * The end of the date range
    */
    // @ApiMember(Description="The end of the date range")
    // @Required()
    public endDate: string;

    /**
    * Restrict to a specific center
    */
    // @ApiMember(Description="Restrict to a specific center")
    public centerId: string;

    /**
    * Restrict to a specific client
    */
    // @ApiMember(Description="Restrict to a specific client")
    public clientId: string;

    public constructor(init?: Partial<GetAIUsage>) { (Object as any).assign(this, init); }
    public createResponse() { return new AIUsageResult(); }
    public getTypeName() { return 'GetAIUsage'; }
}

// @Route("/appointments", "GET")
export class ListAppointments extends ListEvents<AppointmentInfo> implements IReturn<ListEventsResponse<AppointmentInfo>>, IGet
{
    public calendarIds: string[];

    public constructor(init?: Partial<ListAppointments>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListEventsResponse<AppointmentInfo>(); }
    public getTypeName() { return 'ListAppointments'; }
}

// @Route("/appointments/{id}", "GET")
export class GetAppointment extends GetEvent<AppointmentInfo> implements IReturn<AppointmentInfo>, IGet
{

    public constructor(init?: Partial<GetAppointment>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AppointmentInfo(); }
    public getTypeName() { return 'GetAppointment'; }
}

// @Route("/appointments", "POST")
export class NewAppointment extends NewEvent<AppointmentInfo> implements IReturn<AppointmentInfo>, IPost, IUpdateEvent, IUpdateAppointment
{
    public calendarId: string;

    public constructor(init?: Partial<NewAppointment>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AppointmentInfo(); }
    public getTypeName() { return 'NewAppointment'; }
}

// @Route("/appointments", "PATCH")
export class PatchAppointment extends PatchEvent<AppointmentInfo> implements IReturn<AppointmentInfo>, IPatch, IUpdateEvent, IUpdateAppointment
{
    public calendarId: string;

    public constructor(init?: Partial<PatchAppointment>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AppointmentInfo(); }
    public getTypeName() { return 'PatchAppointment'; }
}

// @Route("/appointments/{id}", "DELETE")
export class DeleteAppointment extends DeleteEvent<AppointmentInfo> implements IReturnVoid, IDelete
{

    public constructor(init?: Partial<DeleteAppointment>) { super(init); (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteAppointment'; }
}

// @Route("/calendars", "POST")
export class NewCalendar extends EditCalendar implements IReturn<CalendarInfo>
{

    public constructor(init?: Partial<NewCalendar>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CalendarInfo(); }
    public getTypeName() { return 'NewCalendar'; }
}

// @Route("/calendars/{id}", "PATCH")
export class PatchCalendar extends EditCalendar implements IReturn<CalendarInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchCalendar>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CalendarInfo(); }
    public getTypeName() { return 'PatchCalendar'; }
}

// @Route("/calendars/{id}", "DELETE")
export class DeleteCalendar implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteCalendar>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteCalendar'; }
}

// @Route("/calendars/{id}", "GET")
export class GetCalendar implements IReturn<CalendarInfo>
{
    public id: string;

    public constructor(init?: Partial<GetCalendar>) { (Object as any).assign(this, init); }
    public createResponse() { return new CalendarInfo(); }
    public getTypeName() { return 'GetCalendar'; }
}

// @Route("/calendars", "GET")
export class ListCalendars extends ListEntitiesRequest<CalendarInfo> implements IReturn<ListResponse<CalendarInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public clientId: string;

    public constructor(init?: Partial<ListCalendars>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<CalendarInfo>(); }
    public getTypeName() { return 'ListCalendars'; }
}

// @Route("/call-insights/charts")
export class GetCallInsightCharts implements IReturn<CallInsightCharts>
{
    public startTime: DateRangeFilter;
    public centerId: string;
    public clientId: string;
    public chartSettings: CallInsightChartSettings[];
    public insightFilter: string;

    public constructor(init?: Partial<GetCallInsightCharts>) { (Object as any).assign(this, init); }
    public createResponse() { return new CallInsightCharts(); }
    public getTypeName() { return 'GetCallInsightCharts'; }
}

// @Route("/call-insights/upload")
export class UploadCallInsight implements IReturn<CallInsightResponse>
{
    public clientId: string;
    public insightId: string;

    public constructor(init?: Partial<UploadCallInsight>) { (Object as any).assign(this, init); }
    public createResponse() { return new CallInsightResponse(); }
    public getTypeName() { return 'UploadCallInsight'; }
}

// @Route("/call-insights/liveanswer", "POST")
export class ProcessLiveAnswerInsights implements IReturnVoid, IPost
{
    public clientId: string;
    public callRecordId: string;
    public liveAnswerData: LiveAnswerData;

    public constructor(init?: Partial<ProcessLiveAnswerInsights>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ProcessLiveAnswerInsights'; }
}

// @Route("/call-insights/process")
export class ProcessCallInsights implements IReturnVoid
{
    public callId: string;
    public callRecordingUrl: string;
    public transcript: TranscriptLine[];
    public transfers: TransferTranscript[];

    public constructor(init?: Partial<ProcessCallInsights>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ProcessCallInsights'; }
}

// @Route("/callinsights", "POST")
export class NewCallInsight extends EditCallInsight implements IReturn<CallInsightInfo>
{

    public constructor(init?: Partial<NewCallInsight>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CallInsightInfo(); }
    public getTypeName() { return 'NewCallInsight'; }
}

// @Route("/callinsights/{id}", "PATCH")
export class PatchCallInsight extends EditCallInsight implements IReturn<CallInsightInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchCallInsight>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CallInsightInfo(); }
    public getTypeName() { return 'PatchCallInsight'; }
}

// @Route("/callinsights/{id}", "DELETE")
export class DeleteCallInsight implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteCallInsight>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteCallInsight'; }
}

// @Route("/callinsights/{id}", "GET")
export class GetCallInsight implements IReturn<CallInsightInfo>
{
    public id: string;

    public constructor(init?: Partial<GetCallInsight>) { (Object as any).assign(this, init); }
    public createResponse() { return new CallInsightInfo(); }
    public getTypeName() { return 'GetCallInsight'; }
}

// @Route("/callinsights", "GET")
export class ListCallInsights extends ListEntitiesRequest<CallInsightInfo> implements IReturn<ListResponse<CallInsightInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public clientId: string;

    public constructor(init?: Partial<ListCallInsights>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<CallInsightInfo>(); }
    public getTypeName() { return 'ListCallInsights'; }
}

// @Route("/categories", "POST")
export class NewCategory extends EditCategory implements IReturn<CategoryInfo>
{

    public constructor(init?: Partial<NewCategory>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CategoryInfo(); }
    public getTypeName() { return 'NewCategory'; }
}

// @Route("/categories/{id}", "PATCH")
export class PatchCategory extends EditCategory implements IReturn<CategoryInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchCategory>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CategoryInfo(); }
    public getTypeName() { return 'PatchCategory'; }
}

// @Route("/categories/{id}", "DELETE")
export class DeleteCategory implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteCategory>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteCategory'; }
}

// @Route("/categories/{id}", "GET")
export class GetCategory implements IReturn<CategoryInfo>
{
    public id: string;

    public constructor(init?: Partial<GetCategory>) { (Object as any).assign(this, init); }
    public createResponse() { return new CategoryInfo(); }
    public getTypeName() { return 'GetCategory'; }
}

// @Route("/categories", "GET")
export class ListCategories extends ListEntitiesRequest<CategoryInfo> implements IReturn<ListResponse<CategoryInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public description: string;
    public centerId: string;
    public role: CategoryRoles;

    public constructor(init?: Partial<ListCategories>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<CategoryInfo>(); }
    public getTypeName() { return 'ListCategories'; }
}

// @Route("/centers", "POST")
export class NewCenter extends EditCenter implements IReturn<CenterInfo>
{

    public constructor(init?: Partial<NewCenter>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CenterInfo(); }
    public getTypeName() { return 'NewCenter'; }
}

// @Route("/centers/{id}", "PATCH")
export class PatchCenter extends EditCenter implements IReturn<CenterInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchCenter>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new CenterInfo(); }
    public getTypeName() { return 'PatchCenter'; }
}

// @Route("/centers/{id}", "DELETE")
export class DeleteCenter implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteCenter>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteCenter'; }
}

// @Route("/centers/{id}", "GET")
export class GetCenter implements IReturn<CenterInfo>
{
    public id: string;

    public constructor(init?: Partial<GetCenter>) { (Object as any).assign(this, init); }
    public createResponse() { return new CenterInfo(); }
    public getTypeName() { return 'GetCenter'; }
}

// @Route("/centers", "GET")
export class ListCenters extends ListEntitiesRequest<CenterInfo> implements IReturn<ListResponse<CenterInfo>>, IGet
{
    public latitude: number;
    public longitude: number;
    public distance: number;
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListCenters>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<CenterInfo>(); }
    public getTypeName() { return 'ListCenters'; }
}

// @Route("/centers/{id}/invoiceLogo", "POST")
export class UpdateCenterInvoiceLogo implements IReturn<UploadFileResponse>
{
    public id: string;

    public constructor(init?: Partial<UpdateCenterInvoiceLogo>) { (Object as any).assign(this, init); }
    public createResponse() { return new UploadFileResponse(); }
    public getTypeName() { return 'UpdateCenterInvoiceLogo'; }
}

// @Route("/centers/{id}/invoiceLogo", "DELETE")
export class DeleteCenterInvoiceLogo implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteCenterInvoiceLogo>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteCenterInvoiceLogo'; }
}

// @Route("/charges", "POST")
export class NewCharge extends EditCharge implements IReturn<ChargeInfo>
{

    public constructor(init?: Partial<NewCharge>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ChargeInfo(); }
    public getTypeName() { return 'NewCharge'; }
}

// @Route("/charges/{id}", "PATCH")
export class PatchCharge extends EditCharge implements IReturn<ChargeInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchCharge>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ChargeInfo(); }
    public getTypeName() { return 'PatchCharge'; }
}

// @Route("/charges/{id}", "DELETE")
export class DeleteCharge implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteCharge>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteCharge'; }
}

// @Route("/charges/{id}", "GET")
export class GetCharge implements IReturn<ChargeInfo>
{
    public id: string;

    public constructor(init?: Partial<GetCharge>) { (Object as any).assign(this, init); }
    public createResponse() { return new ChargeInfo(); }
    public getTypeName() { return 'GetCharge'; }
}

// @Route("/charges", "GET")
export class ListCharges extends ListEntitiesRequest<ChargeInfo> implements IReturn<ListResponse<ChargeInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public dateOfCharge: DateRangeFilter;
    public serviceId: string;
    public clientId: string;
    public contactId: string;
    public description: string;
    public memorized: boolean;
    public centerId: string;

    public constructor(init?: Partial<ListCharges>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ChargeInfo>(); }
    public getTypeName() { return 'ListCharges'; }
}

// @Route("/clients/{id}/kb-chat-session", "POST")
export class StartClientKbSession implements IReturn<ClientKbSessionInfo>
{
    public clientId: string;

    public constructor(init?: Partial<StartClientKbSession>) { (Object as any).assign(this, init); }
    public createResponse() { return new ClientKbSessionInfo(); }
    public getTypeName() { return 'StartClientKbSession'; }
}

// @Route("/clients/kb-chat-session/transcript")
export class GetClientKbChatTranscript implements IReturn<ClientKbChatTranscript>
{
    public chatToken: string;

    public constructor(init?: Partial<GetClientKbChatTranscript>) { (Object as any).assign(this, init); }
    public createResponse() { return new ClientKbChatTranscript(); }
    public getTypeName() { return 'GetClientKbChatTranscript'; }
}

// @Route("/clients/{id}/kb-chat-session/messages", "POST")
export class SendClientKbChatMessage implements IReturnVoid
{
    public chatToken: string;
    public message: string;

    public constructor(init?: Partial<SendClientKbChatMessage>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'SendClientKbChatMessage'; }
}

// @Route("/clients/{id}/kb/test", "POST")
export class TestClientKb implements IReturn<TestClientKbResult>
{
    public id: string;
    public question: string;
    public kbEntryIndex: number;

    public constructor(init?: Partial<TestClientKb>) { (Object as any).assign(this, init); }
    public createResponse() { return new TestClientKbResult(); }
    public getTypeName() { return 'TestClientKb'; }
}

// @Route("/clients/{id}/kb-global-status", "GET")
export class GetClientKbGlobalStatus implements IReturn<ClientKbStatus>
{
    public id: string;

    public constructor(init?: Partial<GetClientKbGlobalStatus>) { (Object as any).assign(this, init); }
    public createResponse() { return new ClientKbStatus(); }
    public getTypeName() { return 'GetClientKbGlobalStatus'; }
}

// @Route("/clients/{id}/kb-status/{index}", "GET")
export class GetClientKbStatus implements IReturn<ClientKbStatus>
{
    public id: string;
    public index: number;

    public constructor(init?: Partial<GetClientKbStatus>) { (Object as any).assign(this, init); }
    public createResponse() { return new ClientKbStatus(); }
    public getTypeName() { return 'GetClientKbStatus'; }
}

// @Route("/clients/{id}/assign-to-center", "POST")
export class AssignToCenter implements IReturn<ClientInfo>
{
    public id: string;
    public centerId: string;

    public constructor(init?: Partial<AssignToCenter>) { (Object as any).assign(this, init); }
    public createResponse() { return new ClientInfo(); }
    public getTypeName() { return 'AssignToCenter'; }
}

// @Route("/clients", "POST")
export class NewClient extends EditClient implements IReturn<ClientInfo>
{

    public constructor(init?: Partial<NewClient>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ClientInfo(); }
    public getTypeName() { return 'NewClient'; }
}

// @Route("/clients/{id}", "PATCH")
export class PatchClient extends EditClient implements IReturn<ClientInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchClient>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ClientInfo(); }
    public getTypeName() { return 'PatchClient'; }
}

// @Route("/clients/{id}", "DELETE")
export class DeleteClient implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteClient>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteClient'; }
}

// @Route("/clients/{id}", "GET")
export class GetClient implements IReturn<ClientInfo>
{
    public id: string;

    public constructor(init?: Partial<GetClient>) { (Object as any).assign(this, init); }
    public createResponse() { return new ClientInfo(); }
    public getTypeName() { return 'GetClient'; }
}

// @Route("/clients", "GET")
export class ListClients extends ListEntitiesRequest<ClientInfo> implements IReturn<ListResponse<ClientInfo>>, IGet
{
    public billingEmailAddress: string;
    public aiConfigSource: ClientAIConfigSources;
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public contractId: string;
    public referenceId: string;

    public constructor(init?: Partial<ListClients>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ClientInfo>(); }
    public getTypeName() { return 'ListClients'; }
}

// @Route("/clients/{id}/logo", "POST")
export class UpdateClientLogo implements IReturn<UploadFileResponse>
{
    public id: string;

    public constructor(init?: Partial<UpdateClientLogo>) { (Object as any).assign(this, init); }
    public createResponse() { return new UploadFileResponse(); }
    public getTypeName() { return 'UpdateClientLogo'; }
}

// @Route("/clients/{id}/logo", "DELETE")
export class DeleteClientLogo implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteClientLogo>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteClientLogo'; }
}

// @Route("/templates", "POST")
export class NewClientTemplate extends EditClientTemplate implements IReturn<ClientTemplateInfo>
{

    public constructor(init?: Partial<NewClientTemplate>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ClientTemplateInfo(); }
    public getTypeName() { return 'NewClientTemplate'; }
}

// @Route("/templates/{id}", "PATCH")
export class PatchClientTemplate extends EditClientTemplate implements IReturn<ClientTemplateInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchClientTemplate>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ClientTemplateInfo(); }
    public getTypeName() { return 'PatchClientTemplate'; }
}

// @Route("/templates/{id}", "DELETE")
export class DeleteClientTemplate implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteClientTemplate>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteClientTemplate'; }
}

// @Route("/templates/{id}", "GET")
export class GetClientTemplate implements IReturn<ClientTemplateInfo>
{
    public id: string;

    public constructor(init?: Partial<GetClientTemplate>) { (Object as any).assign(this, init); }
    public createResponse() { return new ClientTemplateInfo(); }
    public getTypeName() { return 'GetClientTemplate'; }
}

// @Route("/templates", "GET")
export class ListClientTemplates extends ListEntitiesRequest<ClientTemplateInfo> implements IReturn<ListResponse<ClientTemplateInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public clientId: string;

    public constructor(init?: Partial<ListClientTemplates>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ClientTemplateInfo>(); }
    public getTypeName() { return 'ListClientTemplates'; }
}

// @Route("/completed-forms/{id}", "GET")
export class GetCompletedForm implements IReturn<CompletedFormInfo>
{
    public id: string;

    public constructor(init?: Partial<GetCompletedForm>) { (Object as any).assign(this, init); }
    public createResponse() { return new CompletedFormInfo(); }
    public getTypeName() { return 'GetCompletedForm'; }
}

// @Route("/completed-forms", "GET")
export class ListCompletedForms extends ListEntitiesRequest<CompletedFormInfo> implements IReturn<ListResponse<CompletedFormInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public dateCompleted: DateRangeFilter;
    public formId: string;
    public clientId: string;
    public contactId: string;
    public emailSubject: string;
    public callerNumber: string;

    public constructor(init?: Partial<ListCompletedForms>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<CompletedFormInfo>(); }
    public getTypeName() { return 'ListCompletedForms'; }
}

// @Route("/console/report-issue", "POST")
export class ReportIssue implements IReturnVoid, IPost
{
    public description: string;
    public contactEmailAddress: string;
    public diagnosticsJson: string;

    public constructor(init?: Partial<ReportIssue>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ReportIssue'; }
}

// @Route("/console/alerts", "POST")
export class UpdateAlertAndStatus implements IReturnVoid, IPost
{
    public type: UpdateAlertStatusTypes;
    public newValue: string;
    public clientId: string;
    public contactId: string;
    public updateProtected: boolean;
    public expirationDate: string;

    public constructor(init?: Partial<UpdateAlertAndStatus>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'UpdateAlertAndStatus'; }
}

// @Route("/console/screen-pops")
export class GetScreenPops implements IReturn<ConsoleScreenPopInfo[]>
{

    public constructor(init?: Partial<GetScreenPops>) { (Object as any).assign(this, init); }
    public createResponse() { return new Array<ConsoleScreenPopInfo>(); }
    public getTypeName() { return 'GetScreenPops'; }
}

// @Route("/console/pop", "GET")
export class ConsolePopRequest implements IReturn<ConsolePopResponse>
{
    public dialedNumber: string;
    public clientId: string;
    public contactId: string;
    public forceInfo: boolean;
    public isAIScreenPop: boolean;
    public associatesOrder: AssociateListOrder;

    public constructor(init?: Partial<ConsolePopRequest>) { (Object as any).assign(this, init); }
    public createResponse() { return new ConsolePopResponse(); }
    public getTypeName() { return 'ConsolePopRequest'; }
}

// @Route("/console/client-info")
export class GetClientContactInfo implements IReturn<GetClientContactInfoResponse>
{
    public clientId: string;
    public contactId: string;

    public constructor(init?: Partial<GetClientContactInfo>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetClientContactInfoResponse(); }
    public getTypeName() { return 'GetClientContactInfo'; }
}

// @Route("/console/search", "GET")
export class ConsoleSearch implements IReturn<ConsoleSearchResult[]>
{
    public type: ConsoleSearchTypes;
    public query: string;

    public constructor(init?: Partial<ConsoleSearch>) { (Object as any).assign(this, init); }
    public createResponse() { return new Array<ConsoleSearchResult>(); }
    public getTypeName() { return 'ConsoleSearch'; }
}

// @Route("/contacts", "POST")
export class NewContact extends EditContact implements IReturn<ContactInfo>
{

    public constructor(init?: Partial<NewContact>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ContactInfo(); }
    public getTypeName() { return 'NewContact'; }
}

// @Route("/contacts/{id}", "PATCH")
export class PatchContact extends EditContact implements IReturn<ContactInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchContact>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ContactInfo(); }
    public getTypeName() { return 'PatchContact'; }
}

// @Route("/contacts/{id}", "DELETE")
export class DeleteContact implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteContact>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteContact'; }
}

// @Route("/contacts/{id}", "GET")
export class GetContact implements IReturn<ContactInfo>
{
    public id: string;

    public constructor(init?: Partial<GetContact>) { (Object as any).assign(this, init); }
    public createResponse() { return new ContactInfo(); }
    public getTypeName() { return 'GetContact'; }
}

// @Route("/contacts", "GET")
export class ListContacts extends ListEntitiesRequest<ContactInfo> implements IReturn<ListResponse<ContactInfo>>, IGet
{
    public includeInformation: boolean;
    public emailAddress: string;
    public dateCreated: DateRangeFilter;
    public clientId: string;
    public firstName: string;
    public lastName: string;
    public referenceId: string;
    public centerId: string;

    public constructor(init?: Partial<ListContacts>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ContactInfo>(); }
    public getTypeName() { return 'ListContacts'; }
}

// @Route("/contacts/{id}/photo", "POST")
export class UpdateContactPhoto implements IReturn<UploadFileResponse>
{
    public id: string;

    public constructor(init?: Partial<UpdateContactPhoto>) { (Object as any).assign(this, init); }
    public createResponse() { return new UploadFileResponse(); }
    public getTypeName() { return 'UpdateContactPhoto'; }
}

// @Route("/contacts/{id}/photo", "DELETE")
export class DeleteContactPhoto implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteContactPhoto>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteContactPhoto'; }
}

// @Route("/contracts", "POST")
export class NewContract extends EditContract implements IReturn<ContractInfo>
{

    public constructor(init?: Partial<NewContract>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ContractInfo(); }
    public getTypeName() { return 'NewContract'; }
}

// @Route("/contracts/{id}", "PATCH")
export class PatchContract extends EditContract implements IReturn<ContractInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchContract>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ContractInfo(); }
    public getTypeName() { return 'PatchContract'; }
}

// @Route("/contracts/{id}", "DELETE")
export class DeleteContract implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteContract>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteContract'; }
}

// @Route("/contracts/{id}", "GET")
export class GetContract implements IReturn<ContractInfo>
{
    public id: string;

    public constructor(init?: Partial<GetContract>) { (Object as any).assign(this, init); }
    public createResponse() { return new ContractInfo(); }
    public getTypeName() { return 'GetContract'; }
}

// @Route("/contracts", "GET")
export class ListContracts extends ListEntitiesRequest<ContractInfo> implements IReturn<ListResponse<ContractInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public masterId: string;

    public constructor(init?: Partial<ListContracts>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ContractInfo>(); }
    public getTypeName() { return 'ListContracts'; }
}

// @Route("/departments", "POST")
export class NewDepartment extends EditDepartment implements IReturn<DepartmentInfo>
{

    public constructor(init?: Partial<NewDepartment>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new DepartmentInfo(); }
    public getTypeName() { return 'NewDepartment'; }
}

// @Route("/departments/{id}", "PATCH")
export class PatchDepartment extends EditDepartment implements IReturn<DepartmentInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchDepartment>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new DepartmentInfo(); }
    public getTypeName() { return 'PatchDepartment'; }
}

// @Route("/departments/{id}", "DELETE")
export class DeleteDepartment implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteDepartment>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteDepartment'; }
}

// @Route("/departments/{id}", "GET")
export class GetDepartment implements IReturn<DepartmentInfo>
{
    public id: string;

    public constructor(init?: Partial<GetDepartment>) { (Object as any).assign(this, init); }
    public createResponse() { return new DepartmentInfo(); }
    public getTypeName() { return 'GetDepartment'; }
}

// @Route("/departments", "GET")
export class ListDepartments extends ListEntitiesRequest<DepartmentInfo> implements IReturn<ListResponse<DepartmentInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListDepartments>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<DepartmentInfo>(); }
    public getTypeName() { return 'ListDepartments'; }
}

// @Route("/email/compose-email", "POST")
export class ComposeEmail implements IReturnVoid
{
    public subject: string;
    public to: ComposeEmailAddressInfo[];
    public cc: ComposeEmailAddressInfo[];
    public bcc: ComposeEmailAddressInfo[];
    public body: string;

    public constructor(init?: Partial<ComposeEmail>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ComposeEmail'; }
}

// @Route("/email/{id}", "GET")
export class GetEmailMessage implements IReturn<EmailMessageInfo>
{
    public id: string;

    public constructor(init?: Partial<GetEmailMessage>) { (Object as any).assign(this, init); }
    public createResponse() { return new EmailMessageInfo(); }
    public getTypeName() { return 'GetEmailMessage'; }
}

// @Route("/email", "GET")
export class ListEmail extends ListEntitiesRequest<EmailMessageInfo> implements IReturn<ListResponse<EmailMessageInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public status: EmailMessageStatuses;
    public subject: string;

    public constructor(init?: Partial<ListEmail>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<EmailMessageInfo>(); }
    public getTypeName() { return 'ListEmail'; }
}

// @Route("/files/{id}")
export class GetFile implements IReturn<Blob>
{
    public id: string;

    public constructor(init?: Partial<GetFile>) { (Object as any).assign(this, init); }
    public createResponse() { return new Blob(); }
    public getTypeName() { return 'GetFile'; }
}

// @Route("/forms/{id}/complete", "POST")
export class CompleteForm implements IReturn<CompletedFormInfo>
{
    public id: string;
    public contactId: string;
    public clientId: string;
    public contactIds: string[];
    public emailSubject: string;
    public callRecordId: string;
    public callId: string;
    public callerNumber: string;
    public doNotEmail: boolean;
    public values: CompleteFormValue[];

    public constructor(init?: Partial<CompleteForm>) { (Object as any).assign(this, init); }
    public createResponse() { return new CompletedFormInfo(); }
    public getTypeName() { return 'CompleteForm'; }
}

// @Route("/forms", "POST")
export class NewForm extends EditForm implements IReturn<FormInfo>
{

    public constructor(init?: Partial<NewForm>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new FormInfo(); }
    public getTypeName() { return 'NewForm'; }
}

// @Route("/forms/{id}", "PATCH")
export class PatchForm extends EditForm implements IReturn<FormInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchForm>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new FormInfo(); }
    public getTypeName() { return 'PatchForm'; }
}

// @Route("/forms/{id}", "DELETE")
export class DeleteForm implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteForm>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteForm'; }
}

// @Route("/forms/{id}", "GET")
export class GetForm implements IReturn<FormInfo>
{
    public id: string;

    public constructor(init?: Partial<GetForm>) { (Object as any).assign(this, init); }
    public createResponse() { return new FormInfo(); }
    public getTypeName() { return 'GetForm'; }
}

// @Route("/forms", "GET")
export class ListForms extends ListEntitiesRequest<FormInfo> implements IReturn<ListResponse<FormInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public clientId: string;
    public contactId: string;
    public billAsServiceId: string;

    public constructor(init?: Partial<ListForms>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<FormInfo>(); }
    public getTypeName() { return 'ListForms'; }
}

// @Route("/industries", "POST")
export class NewIndustry extends EditIndustry implements IReturn<IndustryInfo>
{

    public constructor(init?: Partial<NewIndustry>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new IndustryInfo(); }
    public getTypeName() { return 'NewIndustry'; }
}

// @Route("/industries/{id}", "PATCH")
export class PatchIndustry extends EditIndustry implements IReturn<IndustryInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchIndustry>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new IndustryInfo(); }
    public getTypeName() { return 'PatchIndustry'; }
}

// @Route("/industries/{id}", "DELETE")
export class DeleteIndustry implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteIndustry>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteIndustry'; }
}

// @Route("/industries/{id}", "GET")
export class GetIndustry implements IReturn<IndustryInfo>
{
    public id: string;

    public constructor(init?: Partial<GetIndustry>) { (Object as any).assign(this, init); }
    public createResponse() { return new IndustryInfo(); }
    public getTypeName() { return 'GetIndustry'; }
}

// @Route("/industries", "GET")
export class ListIndustries extends ListEntitiesRequest<IndustryInfo> implements IReturn<ListResponse<IndustryInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListIndustries>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<IndustryInfo>(); }
    public getTypeName() { return 'ListIndustries'; }
}

// @Route("/integrations/{integrationId}/request", "POST")
export class IntegrationRequest implements IReturn<string>
{
    public integrationId: string;
    public type: IntegrationTypes;
    public method: string;
    public data: string;

    public constructor(init?: Partial<IntegrationRequest>) { (Object as any).assign(this, init); }
    public createResponse() { return ''; }
    public getTypeName() { return 'IntegrationRequest'; }
}

// @Route("/integrations", "POST")
export class NewIntegration extends EditIntegration implements IReturn<IntegrationInfo>
{

    public constructor(init?: Partial<NewIntegration>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new IntegrationInfo(); }
    public getTypeName() { return 'NewIntegration'; }
}

// @Route("/integrations/{id}", "PATCH")
export class PatchIntegration extends EditIntegration implements IReturn<IntegrationInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchIntegration>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new IntegrationInfo(); }
    public getTypeName() { return 'PatchIntegration'; }
}

// @Route("/integrations/{id}", "DELETE")
export class DeleteIntegration implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteIntegration>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteIntegration'; }
}

// @Route("/integrations/{id}", "GET")
export class GetIntegration implements IReturn<IntegrationInfo>
{
    public id: string;

    public constructor(init?: Partial<GetIntegration>) { (Object as any).assign(this, init); }
    public createResponse() { return new IntegrationInfo(); }
    public getTypeName() { return 'GetIntegration'; }
}

// @Route("/integrations", "GET")
export class ListIntegrations extends ListEntitiesRequest<IntegrationInfo> implements IReturn<ListResponse<IntegrationInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;

    public constructor(init?: Partial<ListIntegrations>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<IntegrationInfo>(); }
    public getTypeName() { return 'ListIntegrations'; }
}

// @Route("/leads", "POST")
export class NewLead extends EditLead implements IReturn<LeadInfo>
{

    public constructor(init?: Partial<NewLead>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new LeadInfo(); }
    public getTypeName() { return 'NewLead'; }
}

// @Route("/leads/{id}", "PATCH")
export class PatchLead extends EditLead implements IReturn<LeadInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchLead>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new LeadInfo(); }
    public getTypeName() { return 'PatchLead'; }
}

// @Route("/leads/{id}", "DELETE")
export class DeleteLead implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteLead>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteLead'; }
}

// @Route("/leads/{id}", "GET")
export class GetLead implements IReturn<LeadInfo>
{
    public id: string;

    public constructor(init?: Partial<GetLead>) { (Object as any).assign(this, init); }
    public createResponse() { return new LeadInfo(); }
    public getTypeName() { return 'GetLead'; }
}

// @Route("/leads", "GET")
export class ListLeads extends ListEntitiesRequest<LeadInfo> implements IReturn<ListResponse<LeadInfo>>, IGet
{
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListLeads>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<LeadInfo>(); }
    public getTypeName() { return 'ListLeads'; }
}

// @Route("/lead-source", "POST")
export class NewLeadSource extends EditLeadSource implements IReturn<LeadSourceInfo>
{

    public constructor(init?: Partial<NewLeadSource>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new LeadSourceInfo(); }
    public getTypeName() { return 'NewLeadSource'; }
}

// @Route("/lead-source/{id}", "PATCH")
export class PatchLeadSource extends EditLeadSource implements IReturn<LeadSourceInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchLeadSource>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new LeadSourceInfo(); }
    public getTypeName() { return 'PatchLeadSource'; }
}

// @Route("/lead-source/{id}", "DELETE")
export class DeleteLeadSource implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteLeadSource>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteLeadSource'; }
}

// @Route("/lead-source/{id}", "GET")
export class GetLeadSource implements IReturn<LeadSourceInfo>
{
    public id: string;

    public constructor(init?: Partial<GetLeadSource>) { (Object as any).assign(this, init); }
    public createResponse() { return new LeadSourceInfo(); }
    public getTypeName() { return 'GetLeadSource'; }
}

// @Route("/lead-source", "GET")
export class ListLeadSources extends ListEntitiesRequest<LeadSourceInfo> implements IReturn<ListResponse<LeadSourceInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListLeadSources>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<LeadSourceInfo>(); }
    public getTypeName() { return 'ListLeadSources'; }
}

// @Route("/lead-stages", "POST")
export class NewLeadStage extends EditLeadStage implements IReturn<LeadStageInfo>
{

    public constructor(init?: Partial<NewLeadStage>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new LeadStageInfo(); }
    public getTypeName() { return 'NewLeadStage'; }
}

// @Route("/lead-stages/{id}", "PATCH")
export class PatchLeadStage extends EditLeadStage implements IReturn<LeadStageInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchLeadStage>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new LeadStageInfo(); }
    public getTypeName() { return 'PatchLeadStage'; }
}

// @Route("/lead-stages/{id}", "DELETE")
export class DeleteLeadStage implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteLeadStage>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteLeadStage'; }
}

// @Route("/lead-stages/{id}", "GET")
export class GetLeadStage implements IReturn<LeadStageInfo>
{
    public id: string;

    public constructor(init?: Partial<GetLeadStage>) { (Object as any).assign(this, init); }
    public createResponse() { return new LeadStageInfo(); }
    public getTypeName() { return 'GetLeadStage'; }
}

// @Route("/lead-stages", "GET")
export class ListLeadStages extends ListEntitiesRequest<LeadStageInfo> implements IReturn<ListResponse<LeadStageInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListLeadStages>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<LeadStageInfo>(); }
    public getTypeName() { return 'ListLeadStages'; }
}

// @Route("/log/browser", "POST")
export class PushBrowserLog implements IReturnVoid
{
    public deviceId: string;
    public uniqueId: string;
    public log: string;

    public constructor(init?: Partial<PushBrowserLog>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'PushBrowserLog'; }
}

// @Route("/meeting-rooms", "POST")
export class NewMeetingRoom extends EditMeetingRoom implements IReturn<MeetingRoomInfo>
{

    public constructor(init?: Partial<NewMeetingRoom>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new MeetingRoomInfo(); }
    public getTypeName() { return 'NewMeetingRoom'; }
}

// @Route("/meeting-rooms/{id}", "PATCH")
export class PatchMeetingRoom extends EditMeetingRoom implements IReturn<MeetingRoomInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchMeetingRoom>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new MeetingRoomInfo(); }
    public getTypeName() { return 'PatchMeetingRoom'; }
}

// @Route("/meeting-rooms/{id}", "DELETE")
export class DeleteMeetingRoom implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteMeetingRoom>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteMeetingRoom'; }
}

// @Route("/meeting-rooms/{id}", "GET")
export class GetMeetingRoom implements IReturn<MeetingRoomInfo>
{
    public id: string;

    public constructor(init?: Partial<GetMeetingRoom>) { (Object as any).assign(this, init); }
    public createResponse() { return new MeetingRoomInfo(); }
    public getTypeName() { return 'GetMeetingRoom'; }
}

// @Route("/meeting-rooms", "GET")
export class ListMeetingRooms extends ListEntitiesRequest<MeetingRoomInfo> implements IReturn<ListResponse<MeetingRoomInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public visibility: MeetingRoomVisibility;
    public billAsServiceId: string;

    public constructor(init?: Partial<ListMeetingRooms>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<MeetingRoomInfo>(); }
    public getTypeName() { return 'ListMeetingRooms'; }
}

// @Route("/meeting-rooms/{id}/pictures", "POST")
export class UploadMeetingRoomPictures implements IReturn<UploadFileResponse>
{
    public id: string;

    public constructor(init?: Partial<UploadMeetingRoomPictures>) { (Object as any).assign(this, init); }
    public createResponse() { return new UploadFileResponse(); }
    public getTypeName() { return 'UploadMeetingRoomPictures'; }
}

// @Route("/meeting-rooms/{id}/pictures/{fileId}", "DELETE")
export class DeleteMeetingRoomPictures implements IReturnVoid
{
    public id: string;
    public fileId: string;

    public constructor(init?: Partial<DeleteMeetingRoomPictures>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteMeetingRoomPictures'; }
}

// @Route("/integration/oauth-callback", "GET")
export class IntegrationOAuthCallback implements IReturnVoid, IGet
{
    public code: string;
    public state: string;

    public constructor(init?: Partial<IntegrationOAuthCallback>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'IntegrationOAuthCallback'; }
}

// @Route("/phone-systems", "POST")
export class NewPhoneSystemInfo extends EditPhoneSystemInfo implements IReturn<PhoneSystemInfoInfo>
{

    public constructor(init?: Partial<NewPhoneSystemInfo>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new PhoneSystemInfoInfo(); }
    public getTypeName() { return 'NewPhoneSystemInfo'; }
}

// @Route("/phone-systems/{id}", "PATCH")
export class PatchPhoneSystemInfo extends EditPhoneSystemInfo implements IReturn<PhoneSystemInfoInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchPhoneSystemInfo>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new PhoneSystemInfoInfo(); }
    public getTypeName() { return 'PatchPhoneSystemInfo'; }
}

// @Route("/phone-systems/{id}", "DELETE")
export class DeletePhoneSystemInfo implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeletePhoneSystemInfo>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeletePhoneSystemInfo'; }
}

// @Route("/phone-systems/{id}", "GET")
export class GetPhoneSystemInfo implements IReturn<PhoneSystemInfoInfo>
{
    public id: string;

    public constructor(init?: Partial<GetPhoneSystemInfo>) { (Object as any).assign(this, init); }
    public createResponse() { return new PhoneSystemInfoInfo(); }
    public getTypeName() { return 'GetPhoneSystemInfo'; }
}

// @Route("/phone-systems", "GET")
export class ListPhoneSystems extends ListEntitiesRequest<PhoneSystemInfoInfo> implements IReturn<ListResponse<PhoneSystemInfoInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public runOnServerId: string;

    public constructor(init?: Partial<ListPhoneSystems>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<PhoneSystemInfoInfo>(); }
    public getTypeName() { return 'ListPhoneSystems'; }
}

// @Route("/ping")
export class Ping implements IReturn<string>
{
    public message: string;

    public constructor(init?: Partial<Ping>) { (Object as any).assign(this, init); }
    public createResponse() { return ''; }
    public getTypeName() { return 'Ping'; }
}

// @Route("/unused")
export class Unused
{
    public loginType: LoginTypes;
    public modules: CoreModules;

    public constructor(init?: Partial<Unused>) { (Object as any).assign(this, init); }
}

// @Route("/products", "GET")
export class ListProducts implements IReturn<ListProductsResult>
{
    public centerId: string;
    public metaServiceId: string;
    public clientId: string;

    public constructor(init?: Partial<ListProducts>) { (Object as any).assign(this, init); }
    public createResponse() { return new ListProductsResult(); }
    public getTypeName() { return 'ListProducts'; }
}

// @Route("/sign-in", "POST")
export class SignIn implements IReturn<AuthInfo>
{
    public customerName: string;
    public userName: string;
    public password: string;

    public constructor(init?: Partial<SignIn>) { (Object as any).assign(this, init); }
    public createResponse() { return new AuthInfo(); }
    public getTypeName() { return 'SignIn'; }
}

// @Route("/sign-out", "POST")
export class SignOut implements IReturnVoid
{

    public constructor(init?: Partial<SignOut>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'SignOut'; }
}

/**
* Gets info about the current authenticated user
*/
// @Route("/auth/info", "GET")
// @Api(Description="Gets info about the current authenticated user")
export class GetAuthInfo implements IReturn<AuthInfo>, IGet
{

    public constructor(init?: Partial<GetAuthInfo>) { (Object as any).assign(this, init); }
    public createResponse() { return new AuthInfo(); }
    public getTypeName() { return 'GetAuthInfo'; }
}

// @Route("/config", "GET")
export class GetConfig implements IReturn<Config>
{

    public constructor(init?: Partial<GetConfig>) { (Object as any).assign(this, init); }
    public createResponse() { return new Config(); }
    public getTypeName() { return 'GetConfig'; }
}

// @Route("/reception-calls/users", "GET")
export class ListReceptionCallUsers implements IReturn<ReceptionCallUsers>
{

    public constructor(init?: Partial<ListReceptionCallUsers>) { (Object as any).assign(this, init); }
    public createResponse() { return new ReceptionCallUsers(); }
    public getTypeName() { return 'ListReceptionCallUsers'; }
}

// @Route("/reception-calls", "POST")
export class NewReceptionCallRecord extends EditReceptionCallRecord implements IReturn<ReceptionCallRecordInfo>
{

    public constructor(init?: Partial<NewReceptionCallRecord>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ReceptionCallRecordInfo(); }
    public getTypeName() { return 'NewReceptionCallRecord'; }
}

// @Route("/reception-calls/{id}", "PATCH")
export class PatchReceptionCallRecord extends EditReceptionCallRecord implements IReturn<ReceptionCallRecordInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchReceptionCallRecord>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ReceptionCallRecordInfo(); }
    public getTypeName() { return 'PatchReceptionCallRecord'; }
}

// @Route("/reception-calls/{id}", "DELETE")
export class DeleteReceptionCallRecord implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteReceptionCallRecord>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteReceptionCallRecord'; }
}

// @Route("/reception-calls/{id}", "GET")
export class GetReceptionCallRecord implements IReturn<ReceptionCallRecordInfo>
{
    public id: string;

    public constructor(init?: Partial<GetReceptionCallRecord>) { (Object as any).assign(this, init); }
    public createResponse() { return new ReceptionCallRecordInfo(); }
    public getTypeName() { return 'GetReceptionCallRecord'; }
}

// @Route("/reception-calls", "GET")
export class ListReceptionCalls extends ListEntitiesRequest<ReceptionCallRecordInfo> implements IReturn<ListResponse<ReceptionCallRecordInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public callType: CallTypes;
    public startTime: DateRangeFilter;
    public clientId: string;
    public centerId: string;
    public type: ReceptionCallTypes;
    public caller: string;
    public answeredByName: string;
    public globalId: string;
    public hasInsights: boolean;
    public insightFilter: string;
    public called: string[];

    public constructor(init?: Partial<ListReceptionCalls>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ReceptionCallRecordInfo>(); }
    public getTypeName() { return 'ListReceptionCalls'; }
}

// @Route("/relationships", "POST")
export class NewRelationship extends EditRelationship implements IReturn<RelationshipInfo>
{

    public constructor(init?: Partial<NewRelationship>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new RelationshipInfo(); }
    public getTypeName() { return 'NewRelationship'; }
}

// @Route("/relationships/{id}", "PATCH")
export class PatchRelationship extends EditRelationship implements IReturn<RelationshipInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchRelationship>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new RelationshipInfo(); }
    public getTypeName() { return 'PatchRelationship'; }
}

// @Route("/relationships/{id}", "DELETE")
export class DeleteRelationship implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteRelationship>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteRelationship'; }
}

// @Route("/relationships/{id}", "GET")
export class GetRelationship implements IReturn<RelationshipInfo>
{
    public id: string;

    public constructor(init?: Partial<GetRelationship>) { (Object as any).assign(this, init); }
    public createResponse() { return new RelationshipInfo(); }
    public getTypeName() { return 'GetRelationship'; }
}

// @Route("/relationships", "GET")
export class ListRelationships extends ListEntitiesRequest<RelationshipInfo> implements IReturn<ListResponse<RelationshipInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListRelationships>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<RelationshipInfo>(); }
    public getTypeName() { return 'ListRelationships'; }
}

// @Route("/servers", "POST")
export class NewRemoteServer extends EditRemoteServer implements IReturn<RemoteServerInfo>
{

    public constructor(init?: Partial<NewRemoteServer>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new RemoteServerInfo(); }
    public getTypeName() { return 'NewRemoteServer'; }
}

// @Route("/servers/{id}", "PATCH")
export class PatchRemoteServer extends EditRemoteServer implements IReturn<RemoteServerInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchRemoteServer>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new RemoteServerInfo(); }
    public getTypeName() { return 'PatchRemoteServer'; }
}

// @Route("/servers/{id}", "DELETE")
export class DeleteRemoteServer implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteRemoteServer>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteRemoteServer'; }
}

// @Route("/servers/{id}", "GET")
export class GetRemoteServer implements IReturn<RemoteServerInfo>
{
    public id: string;

    public constructor(init?: Partial<GetRemoteServer>) { (Object as any).assign(this, init); }
    public createResponse() { return new RemoteServerInfo(); }
    public getTypeName() { return 'GetRemoteServer'; }
}

// @Route("/servers", "GET")
export class ListServers extends ListEntitiesRequest<RemoteServerInfo> implements IReturn<ListResponse<RemoteServerInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListServers>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<RemoteServerInfo>(); }
    public getTypeName() { return 'ListServers'; }
}

// @Route("/reports/booking-dates-report", "GET")
export class RunBookingDatesReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public clientsAtCenter: string;
    public roomsAtCenter: string;
    public client: string;
    public showOnlyBillableReservations: boolean;
    public showOnlyReservationsWithNotes: boolean;
    public showOnlyReservationsWithAdminNotes: boolean;
    public status: AppointmentStatus;

    public constructor(init?: Partial<RunBookingDatesReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/meeting-room-day-sheet-report", "GET")
export class RunMeetingRoomDaySheetReport extends ReportRequestBase
{
    public date: string;
    public center: string;
    public showCompanyNamesOnReservations: boolean;
    public interval: ReservationBookingInterval;
    public startTime: string;
    public endTime: string;

    public constructor(init?: Partial<RunMeetingRoomDaySheetReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/utilization-report", "GET")
export class RunUtilizationReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public startTime: string;
    public endTime: string;
    public centers: string[];
    public excludeClients: string[];
    public includeRoomOccupancy: boolean;
    public includeWeekends: boolean;

    public constructor(init?: Partial<RunUtilizationReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/sign-in-sheet-report", "GET")
export class RunSignInSheetReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public clientsAtCenter: string;
    public roomsAtCenter: string;
    public client: string;
    public showOnlyBillableReservations: boolean;
    public showOnlyReservationsWithNotes: boolean;
    public showOnlyReservationsWithAdminNotes: boolean;
    public status: AppointmentStatus;

    public constructor(init?: Partial<RunSignInSheetReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/day-sheet-report", "GET")
export class RunDaySheetReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public clientsAtCenter: string;
    public roomsAtCenter: string;
    public client: string;
    public showOnlyBillableReservations: boolean;
    public showOnlyReservationsWithNotes: boolean;
    public showOnlyReservationsWithAdminNotes: boolean;
    public status: AppointmentStatus;

    public constructor(init?: Partial<RunDaySheetReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/scheduling-history-report", "GET")
export class RunSchedulingHistoryReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public clientsAtCenter: string;
    public roomsAtCenter: string;
    public client: string;
    public showOnlyBillableReservations: boolean;
    public showOnlyReservationsWithNotes: boolean;
    public showOnlyReservationsWithAdminNotes: boolean;
    public status: AppointmentStatus;

    public constructor(init?: Partial<RunSchedulingHistoryReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/scheduling-billing-report", "GET")
export class RunSchedulingBillingReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public clientsAtCenter: string;
    public roomsAtCenter: string;
    public client: string;
    public showOnlyBillableReservations: boolean;
    public showOnlyReservationsWithNotes: boolean;
    public showOnlyReservationsWithAdminNotes: boolean;
    public status: AppointmentStatus;

    public constructor(init?: Partial<RunSchedulingBillingReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/call-allowance-report-by-day", "GET")
export class RunCallAllowanceReportByDay extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];
    public includeArchivedClients: boolean;
    public removeBalanceColumns: boolean;
    public allowanceType: CallAllowanceReportTypeFilters;

    public constructor(init?: Partial<RunCallAllowanceReportByDay>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/call-allowance-report-v-1", "GET")
export class RunCallAllowanceReportV1 extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public client: string;
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public billableTime: BillableTimeSources[];
    public includeArchivedClients: boolean;

    public constructor(init?: Partial<RunCallAllowanceReportV1>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/call-insights-report", "GET")
export class RunCallInsightsReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];
    public insight: string[];
    public grouping: CallInsightGrouping;

    public constructor(init?: Partial<RunCallInsightsReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/weekly-call-breakdown-report", "GET")
export class RunWeeklyCallBreakdownReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];

    public constructor(init?: Partial<RunWeeklyCallBreakdownReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/call-transfer-report", "GET")
export class RunCallTransferReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];

    public constructor(init?: Partial<RunCallTransferReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/call-count-by-screen-pop-report", "GET")
export class RunCallCountByScreenPopReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];

    public constructor(init?: Partial<RunCallCountByScreenPopReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/monthly-call-breakdown-report", "GET")
export class RunMonthlyCallBreakdownReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];

    public constructor(init?: Partial<RunMonthlyCallBreakdownReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/hourly-call-volume-report", "GET")
export class RunHourlyCallVolumeReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];

    public constructor(init?: Partial<RunHourlyCallVolumeReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/outbound-cdr-report", "GET")
export class RunOutboundCdrReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public center: string;
    public client: string;
    public sortBy: CallRecordSorting;
    public includeRawCdrs: boolean;
    public showEachCall: boolean;
    public onlyIncludeBillableCalls: boolean;

    public constructor(init?: Partial<RunOutboundCdrReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/hourly-call-breakdown-report", "GET")
export class RunHourlyCallBreakdownReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];
    public hideClientInformation: boolean;

    public constructor(init?: Partial<RunHourlyCallBreakdownReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/missed-call-report", "GET")
export class RunMissedCallReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public center: string;
    public categories: string[];
    public client: string;
    public minRingTimeInSeconds: number;

    public constructor(init?: Partial<RunMissedCallReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/operator-transfer-cdr-report", "GET")
export class RunOperatorTransferCdrReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public center: string;
    public client: string;
    public sortBy: CallRecordSorting;
    public includeRawCdrs: boolean;
    public showEachCall: boolean;
    public onlyIncludeBillableCalls: boolean;

    public constructor(init?: Partial<RunOperatorTransferCdrReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/center-call-breakdown-report", "GET")
export class RunCenterCallBreakdownReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];
    public doNotIncludeClientBreakdowns: boolean;

    public constructor(init?: Partial<RunCenterCallBreakdownReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/call-notes-report", "GET")
export class RunCallNotesReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];

    public constructor(init?: Partial<RunCallNotesReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/call-allowance-report", "GET")
export class RunCallAllowanceReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];
    public includeArchivedClients: boolean;
    public removeBalanceColumns: boolean;
    public allowanceType: CallAllowanceReportTypeFilters;

    public constructor(init?: Partial<RunCallAllowanceReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/client-call-breakdown-report", "GET")
export class RunClientCallBreakdownReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];
    public includeCallDetail: boolean;
    public includeCallNotes: boolean;
    public includeCallDisposition: boolean;
    public timeSpanFormat: TimeSpanFormat;

    public constructor(init?: Partial<RunClientCallBreakdownReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/operator-statistics-report", "GET")
export class RunOperatorStatisticsReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public onlyIncludeSpecifiedTimeOfDay: boolean;
    public type: ReportCallTypes;
    public centers: string[];
    public clients: string[];
    public roundCalls: CallRounding;
    public minCallDurationInSeconds: number;
    public maxCallDurationInSeconds: number;
    public categories: string[];
    public callDispositions: string[];
    public billableTime: BillableTimeSources[];
    public groupBy: OperatorStatisticsGrouping;
    public countBy: OperatorStatisticsCounting;
    public includeMissedCallInformation: boolean;
    public minRingTimeInSecondsForMissedCalls: number;

    public constructor(init?: Partial<RunOperatorStatisticsReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/lead-excel-report", "GET")
export class RunLeadExcelReport extends ReportRequestBase
{
    public center: string;

    public constructor(init?: Partial<RunLeadExcelReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/completed-forms-excel-report", "GET")
export class RunCompletedFormsExcelReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public client: string;
    public center: string;

    public constructor(init?: Partial<RunCompletedFormsExcelReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/completed-forms-report", "GET")
export class RunCompletedFormsReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public client: string;
    public center: string;

    public constructor(init?: Partial<RunCompletedFormsReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/client-excel-report", "GET")
export class RunClientExcelReport extends ReportRequestBase
{
    public center: string;

    public constructor(init?: Partial<RunClientExcelReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/client-gain-loss-report", "GET")
export class RunClientGainLossReport extends ReportRequestBase
{
    public timeRange: DateRangeFilter;
    public center: string;

    public constructor(init?: Partial<RunClientGainLossReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/screen-pops-report", "GET")
export class RunScreenPopsReport extends ReportRequestBase
{
    public center: string;
    public showIdsInsteadOfNames: boolean;

    public constructor(init?: Partial<RunScreenPopsReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/custom-fields-report", "GET")
export class RunCustomFieldsReport extends ReportRequestBase
{
    public center: string;

    public constructor(init?: Partial<RunCustomFieldsReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/client-report", "GET")
export class RunClientReport extends ReportRequestBase
{
    public center: string;

    public constructor(init?: Partial<RunClientReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/client-spreadsheet-report", "GET")
export class RunClientSpreadsheetReport extends ReportRequestBase
{
    public center: string;
    public displayMode: ClientReportDisplayModes;
    public onlyShowContactsWithLogins: boolean;
    public showLoginPassword: boolean;

    public constructor(init?: Partial<RunClientSpreadsheetReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/charge-details-export", "GET")
export class RunChargeDetailsExport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public center: string;
    public chargeSources: ChargeSources[];
    public client: string;
    public specificServices: string[];
    public roundCalls: CallRounding;
    public billableTime: BillableTimeSources[];
    public minCallDurationInSeconds: number;
    public showEmptyCharges: boolean;

    public constructor(init?: Partial<RunChargeDetailsExport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/manual-charges-report", "GET")
export class RunManualChargesReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public center: string;
    public client: string;
    public specificServices: string[];
    public groupChargeTotals: boolean;

    public constructor(init?: Partial<RunManualChargesReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/quick-books-excel-export", "GET")
export class RunQuickBooksExcelExport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public invoiceDate: string;
    public chargeSources: ChargeSources[];
    public billableCallTime: BillableTimeSources[];
    public includeZeroChargeLineItems: boolean;
    public lineItemMode: LineItemDetailModes;

    public constructor(init?: Partial<RunQuickBooksExcelExport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/contracts-excel-export", "GET")
export class RunContractsExcelExport extends ReportRequestBase
{

    public constructor(init?: Partial<RunContractsExcelExport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/charge-summary-report", "GET")
export class RunChargeSummaryReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;
    public center: string;
    public chargeSources: ChargeSources[];
    public client: string;
    public specificServices: string[];
    public roundCalls: CallRounding;
    public billableTime: BillableTimeSources[];
    public minCallDurationInSeconds: number;
    public showEmptyCharges: boolean;

    public constructor(init?: Partial<RunChargeSummaryReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reports/appointment-counts-by-user-report", "GET")
export class RunAppointmentCountsByUserReport extends ReportRequestBase
{
    public dateRange: DateRangeFilter;

    public constructor(init?: Partial<RunAppointmentCountsByUserReport>) { super(init); (Object as any).assign(this, init); }
}

// @Route("/reservations/{id}", "GET")
export class GetReservation extends GetEvent<ReservationInfo> implements IReturn<ReservationInfo>, IGet
{

    public constructor(init?: Partial<GetReservation>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ReservationInfo(); }
    public getTypeName() { return 'GetReservation'; }
}

// @Route("/reservations", "GET")
export class ListReservations extends ListEvents<ReservationInfo> implements IReturn<ListEventsResponse<ReservationInfo>>, IGet
{
    public meetingRoomIds: string[];
    public includeLinked: boolean;

    public constructor(init?: Partial<ListReservations>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListEventsResponse<ReservationInfo>(); }
    public getTypeName() { return 'ListReservations'; }
}

// @Route("/reservations", "POST")
export class NewReservation extends NewEvent<ReservationInfo> implements IReturn<ReservationInfo>, IPost, IUpdateEvent, IUpdateReservation
{
    public meetingRoomId: string;
    public clientId: string;
    public paymentStatus: PaymentStatuses;
    public numberOfAttendees: number;
    public adminNotes: string;
    public organizer: AttendeeInfo;
    public resourceIds: string[];

    public constructor(init?: Partial<NewReservation>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ReservationInfo(); }
    public getTypeName() { return 'NewReservation'; }
}

// @Route("/reservations", "PATCH")
export class PatchReservation extends PatchEvent<ReservationInfo> implements IReturn<ReservationInfo>, IPatch, IUpdateEvent, IUpdateReservation
{
    public meetingRoomId: string;
    public clientId: string;
    public paymentStatus: PaymentStatuses;
    public numberOfAttendees: number;
    public adminNotes: string;
    public organizer: AttendeeInfo;
    public resourceIds: string[];

    public constructor(init?: Partial<PatchReservation>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ReservationInfo(); }
    public getTypeName() { return 'PatchReservation'; }
}

// @Route("/reservations/{id}", "DELETE")
export class DeleteReservation extends DeleteEvent<ReservationInfo> implements IReturnVoid, IDelete
{

    public constructor(init?: Partial<DeleteReservation>) { super(init); (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteReservation'; }
}

// @Route("/scheduled-resources", "POST")
export class NewResource extends EditResource implements IReturn<ResourceInfo>
{

    public constructor(init?: Partial<NewResource>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ResourceInfo(); }
    public getTypeName() { return 'NewResource'; }
}

// @Route("/scheduled-resources/{id}", "PATCH")
export class PatchResource extends EditResource implements IReturn<ResourceInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchResource>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ResourceInfo(); }
    public getTypeName() { return 'PatchResource'; }
}

// @Route("/scheduled-resources/{id}", "DELETE")
export class DeleteResource implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteResource>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteResource'; }
}

// @Route("/scheduled-resources/{id}", "GET")
export class GetResource implements IReturn<ResourceInfo>
{
    public id: string;

    public constructor(init?: Partial<GetResource>) { (Object as any).assign(this, init); }
    public createResponse() { return new ResourceInfo(); }
    public getTypeName() { return 'GetResource'; }
}

// @Route("/scheduled-resources", "GET")
export class ListResources extends ListEntitiesRequest<ResourceInfo> implements IReturn<ListResponse<ResourceInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public description: string;
    public billAsServiceId: string;

    public constructor(init?: Partial<ListResources>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ResourceInfo>(); }
    public getTypeName() { return 'ListResources'; }
}

// @Route("/responsibilities", "POST")
export class NewResponsibility extends EditResponsibility implements IReturn<ResponsibilityInfo>
{

    public constructor(init?: Partial<NewResponsibility>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ResponsibilityInfo(); }
    public getTypeName() { return 'NewResponsibility'; }
}

// @Route("/responsibilities/{id}", "PATCH")
export class PatchResponsibility extends EditResponsibility implements IReturn<ResponsibilityInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchResponsibility>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ResponsibilityInfo(); }
    public getTypeName() { return 'PatchResponsibility'; }
}

// @Route("/responsibilities/{id}", "DELETE")
export class DeleteResponsibility implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteResponsibility>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteResponsibility'; }
}

// @Route("/responsibilities/{id}", "GET")
export class GetResponsibility implements IReturn<ResponsibilityInfo>
{
    public id: string;

    public constructor(init?: Partial<GetResponsibility>) { (Object as any).assign(this, init); }
    public createResponse() { return new ResponsibilityInfo(); }
    public getTypeName() { return 'GetResponsibility'; }
}

// @Route("/responsibilities", "GET")
export class ListResponsibilities extends ListEntitiesRequest<ResponsibilityInfo> implements IReturn<ListResponse<ResponsibilityInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;

    public constructor(init?: Partial<ListResponsibilities>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ResponsibilityInfo>(); }
    public getTypeName() { return 'ListResponsibilities'; }
}

// @Route("/ai-session-changes/{id}", "GET")
export class GetAISessionChange implements IReturn<AISessionChangeInfo>
{
    public id: string;

    public constructor(init?: Partial<GetAISessionChange>) { (Object as any).assign(this, init); }
    public createResponse() { return new AISessionChangeInfo(); }
    public getTypeName() { return 'GetAISessionChange'; }
}

// @Route("/ai-session-changes", "GET")
export class ListAISessionChanges extends ListEntitiesRequest<AISessionChangeInfo> implements IReturn<ListResponse<AISessionChangeInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public sessionId: string;

    public constructor(init?: Partial<ListAISessionChanges>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<AISessionChangeInfo>(); }
    public getTypeName() { return 'ListAISessionChanges'; }
}

// @Route("/services", "POST")
export class NewService extends EditService implements IReturn<ServiceInfo>
{

    public constructor(init?: Partial<NewService>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ServiceInfo(); }
    public getTypeName() { return 'NewService'; }
}

// @Route("/services/{id}", "PATCH")
export class PatchService extends EditService implements IReturn<ServiceInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchService>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ServiceInfo(); }
    public getTypeName() { return 'PatchService'; }
}

// @Route("/services/{id}", "DELETE")
export class DeleteService implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteService>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteService'; }
}

// @Route("/services/{id}", "GET")
export class GetService implements IReturn<ServiceInfo>
{
    public id: string;

    public constructor(init?: Partial<GetService>) { (Object as any).assign(this, init); }
    public createResponse() { return new ServiceInfo(); }
    public getTypeName() { return 'GetService'; }
}

// @Route("/services", "GET")
export class ListServices extends ListEntitiesRequest<ServiceInfo> implements IReturn<ListResponse<ServiceInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public description: string;
    public taxId: string;
    public parentServiceId: string;
    public metaServiceId: string;
    public specialType: SpecialServiceTypes;
    public code: string;

    public constructor(init?: Partial<ListServices>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<ServiceInfo>(); }
    public getTypeName() { return 'ListServices'; }
}

// @Route("/services/availability", "POST")
export class GetServiceAvailability implements IReturn<GetServiceAvailabilityResponse>
{
    public centerIds: string[];
    public metaServiceIds: string[];
    public meetingRoomIds: string[];
    public dateTimeStart: string;
    public dateTimeEnd: string;

    public constructor(init?: Partial<GetServiceAvailability>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetServiceAvailabilityResponse(); }
    public getTypeName() { return 'GetServiceAvailability'; }
}

// @Route("/speed-dials", "POST")
export class NewSpeedDial extends EditSpeedDial implements IReturn<SpeedDialInfo>
{

    public constructor(init?: Partial<NewSpeedDial>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new SpeedDialInfo(); }
    public getTypeName() { return 'NewSpeedDial'; }
}

// @Route("/speed-dials/{id}", "PATCH")
export class PatchSpeedDial extends EditSpeedDial implements IReturn<SpeedDialInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchSpeedDial>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new SpeedDialInfo(); }
    public getTypeName() { return 'PatchSpeedDial'; }
}

// @Route("/speed-dials/{id}", "DELETE")
export class DeleteSpeedDial implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteSpeedDial>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteSpeedDial'; }
}

// @Route("/speed-dials/{id}", "GET")
export class GetSpeedDial implements IReturn<SpeedDialInfo>
{
    public id: string;

    public constructor(init?: Partial<GetSpeedDial>) { (Object as any).assign(this, init); }
    public createResponse() { return new SpeedDialInfo(); }
    public getTypeName() { return 'GetSpeedDial'; }
}

// @Route("/speed-dials", "GET")
export class ListSpeedDials extends ListEntitiesRequest<SpeedDialInfo> implements IReturn<ListResponse<SpeedDialInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public centerId: string;

    public constructor(init?: Partial<ListSpeedDials>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<SpeedDialInfo>(); }
    public getTypeName() { return 'ListSpeedDials'; }
}

// @Route("/system-settings", "PATCH")
export class PatchSystemSettings extends EditSystemSettings implements IReturn<SystemSettingsInfo>
{

    public constructor(init?: Partial<PatchSystemSettings>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new SystemSettingsInfo(); }
    public getTypeName() { return 'PatchSystemSettings'; }
}

// @Route("/system-settings", "GET")
export class GetSystemSettings implements IReturn<SystemSettingsInfo>
{

    public constructor(init?: Partial<GetSystemSettings>) { (Object as any).assign(this, init); }
    public createResponse() { return new SystemSettingsInfo(); }
    public getTypeName() { return 'GetSystemSettings'; }
}

// @Route("/system-settings/logo", "POST")
export class UpdateSystemSettingsLogo implements IReturn<UploadFileResponse>
{

    public constructor(init?: Partial<UpdateSystemSettingsLogo>) { (Object as any).assign(this, init); }
    public createResponse() { return new UploadFileResponse(); }
    public getTypeName() { return 'UpdateSystemSettingsLogo'; }
}

// @Route("/system-settings/logo", "DELETE")
export class DeleteSystemSettingsLogo implements IReturnVoid
{

    public constructor(init?: Partial<DeleteSystemSettingsLogo>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteSystemSettingsLogo'; }
}

// @Route("/taxes", "POST")
export class NewTax extends EditTax implements IReturn<TaxInfo>
{

    public constructor(init?: Partial<NewTax>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new TaxInfo(); }
    public getTypeName() { return 'NewTax'; }
}

// @Route("/taxes/{id}", "PATCH")
export class PatchTax extends EditTax implements IReturn<TaxInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchTax>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new TaxInfo(); }
    public getTypeName() { return 'PatchTax'; }
}

// @Route("/taxes/{id}", "DELETE")
export class DeleteTax implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteTax>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteTax'; }
}

// @Route("/taxes/{id}", "GET")
export class GetTax implements IReturn<TaxInfo>
{
    public id: string;

    public constructor(init?: Partial<GetTax>) { (Object as any).assign(this, init); }
    public createResponse() { return new TaxInfo(); }
    public getTypeName() { return 'GetTax'; }
}

// @Route("/taxes", "GET")
export class ListTaxes extends ListEntitiesRequest<TaxInfo> implements IReturn<ListResponse<TaxInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public type: TaxTypes;

    public constructor(init?: Partial<ListTaxes>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<TaxInfo>(); }
    public getTypeName() { return 'ListTaxes'; }
}

// @Route("/team-members", "POST")
export class NewTeamMember extends EditTeamMember implements IReturn<TeamMemberInfo>
{

    public constructor(init?: Partial<NewTeamMember>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new TeamMemberInfo(); }
    public getTypeName() { return 'NewTeamMember'; }
}

// @Route("/team-members/{id}", "PATCH")
export class PatchTeamMember extends EditTeamMember implements IReturn<TeamMemberInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchTeamMember>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new TeamMemberInfo(); }
    public getTypeName() { return 'PatchTeamMember'; }
}

// @Route("/team-members/{id}", "DELETE")
export class DeleteTeamMember implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteTeamMember>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteTeamMember'; }
}

// @Route("/team-members/{id}", "GET")
export class GetTeamMember implements IReturn<TeamMemberInfo>
{
    public id: string;

    public constructor(init?: Partial<GetTeamMember>) { (Object as any).assign(this, init); }
    public createResponse() { return new TeamMemberInfo(); }
    public getTypeName() { return 'GetTeamMember'; }
}

// @Route("/team-members", "GET")
export class ListTeamMembers extends ListEntitiesRequest<TeamMemberInfo> implements IReturn<ListResponse<TeamMemberInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public centerId: string;
    public firstName: string;
    public lastName: string;
    public userName: string;
    public userGroupId: string;
    public emailAddress: string;

    public constructor(init?: Partial<ListTeamMembers>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<TeamMemberInfo>(); }
    public getTypeName() { return 'ListTeamMembers'; }
}

// @Route("/user-groups", "POST")
export class NewUserGroup extends EditUserGroup implements IReturn<UserGroupInfo>
{

    public constructor(init?: Partial<NewUserGroup>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new UserGroupInfo(); }
    public getTypeName() { return 'NewUserGroup'; }
}

// @Route("/user-groups/{id}", "PATCH")
export class PatchUserGroup extends EditUserGroup implements IReturn<UserGroupInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchUserGroup>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new UserGroupInfo(); }
    public getTypeName() { return 'PatchUserGroup'; }
}

// @Route("/user-groups/{id}", "DELETE")
export class DeleteUserGroup implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteUserGroup>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteUserGroup'; }
}

// @Route("/user-groups/{id}", "GET")
export class GetUserGroup implements IReturn<UserGroupInfo>
{
    public id: string;

    public constructor(init?: Partial<GetUserGroup>) { (Object as any).assign(this, init); }
    public createResponse() { return new UserGroupInfo(); }
    public getTypeName() { return 'GetUserGroup'; }
}

// @Route("/user-groups", "GET")
export class ListUserGroups extends ListEntitiesRequest<UserGroupInfo> implements IReturn<ListResponse<UserGroupInfo>>, IGet
{
    public name: string;
    public dateCreated: DateRangeFilter;
    public type: UserGroupTypes;
    public parentCenterId: string;

    public constructor(init?: Partial<ListUserGroups>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<UserGroupInfo>(); }
    public getTypeName() { return 'ListUserGroups'; }
}

/**
* Webhooks are used to have events inside the HostedSuite system trigger an HTTP request to a third party server.Each webhook can be configured to listen for a specific set of events, e.g. ClientCreated, ReservationScheduled, etc.Webhooks share a common core structure but each class of webhook event also has its own payload contained in the eventData field.The core structure of the webhook is as follows (in JSON){    customer: string,   // the hostedsuite customer associated with the webhook    centerId: string,   // the ID of the center associated with this event    centerName: string, // the name of the center associated with this event    timestamp: string,  // ISO 8601 datetime stamp    eventId: string, // the ID associated with this particular webhook call / event, can be used for tracking whether a webhook event has been processed or not    eventName: string,  // the name of the event type e.g. ClientCreated, ReservationScheduled, etc.    eventData: object,  // the payload specific data for this event (see below)}Webhook eventData payloads (by class):Client eventData:{    clientId: string,   // the ID of the client associated with this event    clientName: string, // the name of the client associated with this event}Reservation eventData:{    reservationId: string,  // the ID of the reservation associated with this event    meetingRoomId: string,  // the ID of the meeting room associated with this event}Contact eventData:{    clientId: string,   // the ID of the client this contact is associated with    contactId: string,  // the ID of the contact associated with this event    contactName: string, // the name of the contact associated with this event}You should use the associated IDs in the eventData object to retrieve the relevant data from the API    
*/
// @Route("/webhooks", "POST")
// @Api(Description="\r\nWebhooks are used to have events inside the HostedSuite system trigger an HTTP request to a third party server.\r\n\r\nEach webhook can be configured to listen for a specific set of events, e.g. ClientCreated, ReservationScheduled, etc.\r\n\r\nWebhooks share a common core structure but each class of webhook event also has its own payload contained in the eventData field.\r\n\r\nThe core structure of the webhook is as follows (in JSON)\r\n\r\n{\r\n    customer: string,   // the hostedsuite customer associated with the webhook\r\n    centerId: string,   // the ID of the center associated with this event\r\n    centerName: string, // the name of the center associated with this event\r\n    timestamp: string,  // ISO 8601 datetime stamp\r\n    eventId: string, // the ID associated with this particular webhook call / event, can be used for tracking whether a webhook event has been processed or not\r\n    eventName: string,  // the name of the event type e.g. ClientCreated, ReservationScheduled, etc.\r\n    eventData: object,  // the payload specific data for this event (see below)\r\n}\r\n\r\nWebhook eventData payloads (by class):\r\n\r\nClient eventData:\r\n\r\n{\r\n    clientId: string,   // the ID of the client associated with this event\r\n    clientName: string, // the name of the client associated with this event\r\n}\r\n\r\nReservation eventData:\r\n\r\n{\r\n    reservationId: string,  // the ID of the reservation associated with this event\r\n    meetingRoomId: string,  // the ID of the meeting room associated with this event\r\n}\r\n\r\nContact eventData:\r\n\r\n{\r\n    clientId: string,   // the ID of the client this contact is associated with\r\n    contactId: string,  // the ID of the contact associated with this event\r\n    contactName: string, // the name of the contact associated with this event\r\n}\r\n\r\nYou should use the associated IDs in the eventData object to retrieve the relevant data from the API\r\n\r\n\r\n    ")
export class NewWebhook extends EditWebhook implements IReturn<WebhookInfo>
{

    public constructor(init?: Partial<NewWebhook>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new WebhookInfo(); }
    public getTypeName() { return 'NewWebhook'; }
}

// @Route("/webhooks/{id}", "PATCH")
export class PatchWebhook extends EditWebhook implements IReturn<WebhookInfo>
{
    public id: string;
    public __Restore: boolean;

    public constructor(init?: Partial<PatchWebhook>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new WebhookInfo(); }
    public getTypeName() { return 'PatchWebhook'; }
}

/**
* Webhooks are used to have events inside the HostedSuite system trigger an HTTP request to a third party server.Each webhook can be configured to listen for a specific set of events, e.g. ClientCreated, ReservationScheduled, etc.Webhooks share a common core structure but each class of webhook event also has its own payload contained in the eventData field.The core structure of the webhook is as follows (in JSON){    customer: string,   // the hostedsuite customer associated with the webhook    centerId: string,   // the ID of the center associated with this event    centerName: string, // the name of the center associated with this event    timestamp: string,  // ISO 8601 datetime stamp    eventId: string, // the ID associated with this particular webhook call / event, can be used for tracking whether a webhook event has been processed or not    eventName: string,  // the name of the event type e.g. ClientCreated, ReservationScheduled, etc.    eventData: object,  // the payload specific data for this event (see below)}Webhook eventData payloads (by class):Client eventData:{    clientId: string,   // the ID of the client associated with this event    clientName: string, // the name of the client associated with this event}Reservation eventData:{    reservationId: string,  // the ID of the reservation associated with this event    meetingRoomId: string,  // the ID of the meeting room associated with this event}Contact eventData:{    clientId: string,   // the ID of the client this contact is associated with    contactId: string,  // the ID of the contact associated with this event    contactName: string, // the name of the contact associated with this event}You should use the associated IDs in the eventData object to retrieve the relevant data from the API    
*/
// @Route("/webhooks/{id}", "DELETE")
// @Api(Description="\r\nWebhooks are used to have events inside the HostedSuite system trigger an HTTP request to a third party server.\r\n\r\nEach webhook can be configured to listen for a specific set of events, e.g. ClientCreated, ReservationScheduled, etc.\r\n\r\nWebhooks share a common core structure but each class of webhook event also has its own payload contained in the eventData field.\r\n\r\nThe core structure of the webhook is as follows (in JSON)\r\n\r\n{\r\n    customer: string,   // the hostedsuite customer associated with the webhook\r\n    centerId: string,   // the ID of the center associated with this event\r\n    centerName: string, // the name of the center associated with this event\r\n    timestamp: string,  // ISO 8601 datetime stamp\r\n    eventId: string, // the ID associated with this particular webhook call / event, can be used for tracking whether a webhook event has been processed or not\r\n    eventName: string,  // the name of the event type e.g. ClientCreated, ReservationScheduled, etc.\r\n    eventData: object,  // the payload specific data for this event (see below)\r\n}\r\n\r\nWebhook eventData payloads (by class):\r\n\r\nClient eventData:\r\n\r\n{\r\n    clientId: string,   // the ID of the client associated with this event\r\n    clientName: string, // the name of the client associated with this event\r\n}\r\n\r\nReservation eventData:\r\n\r\n{\r\n    reservationId: string,  // the ID of the reservation associated with this event\r\n    meetingRoomId: string,  // the ID of the meeting room associated with this event\r\n}\r\n\r\nContact eventData:\r\n\r\n{\r\n    clientId: string,   // the ID of the client this contact is associated with\r\n    contactId: string,  // the ID of the contact associated with this event\r\n    contactName: string, // the name of the contact associated with this event\r\n}\r\n\r\nYou should use the associated IDs in the eventData object to retrieve the relevant data from the API\r\n\r\n\r\n    ")
export class DeleteWebhook implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<DeleteWebhook>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DeleteWebhook'; }
}

// @Route("/webhooks/{id}", "GET")
export class GetWebhook implements IReturn<WebhookInfo>
{
    public id: string;

    public constructor(init?: Partial<GetWebhook>) { (Object as any).assign(this, init); }
    public createResponse() { return new WebhookInfo(); }
    public getTypeName() { return 'GetWebhook'; }
}

/**
* Webhooks are used to have events inside the HostedSuite system trigger an HTTP request to a third party server.Each webhook can be configured to listen for a specific set of events, e.g. ClientCreated, ReservationScheduled, etc.Webhooks share a common core structure but each class of webhook event also has its own payload contained in the eventData field.The core structure of the webhook is as follows (in JSON){    customer: string,   // the hostedsuite customer associated with the webhook    centerId: string,   // the ID of the center associated with this event    centerName: string, // the name of the center associated with this event    timestamp: string,  // ISO 8601 datetime stamp    eventId: string, // the ID associated with this particular webhook call / event, can be used for tracking whether a webhook event has been processed or not    eventName: string,  // the name of the event type e.g. ClientCreated, ReservationScheduled, etc.    eventData: object,  // the payload specific data for this event (see below)}Webhook eventData payloads (by class):Client eventData:{    clientId: string,   // the ID of the client associated with this event    clientName: string, // the name of the client associated with this event}Reservation eventData:{    reservationId: string,  // the ID of the reservation associated with this event    meetingRoomId: string,  // the ID of the meeting room associated with this event}Contact eventData:{    clientId: string,   // the ID of the client this contact is associated with    contactId: string,  // the ID of the contact associated with this event    contactName: string, // the name of the contact associated with this event}You should use the associated IDs in the eventData object to retrieve the relevant data from the API    
*/
// @Route("/webhooks", "GET")
// @Api(Description="\r\nWebhooks are used to have events inside the HostedSuite system trigger an HTTP request to a third party server.\r\n\r\nEach webhook can be configured to listen for a specific set of events, e.g. ClientCreated, ReservationScheduled, etc.\r\n\r\nWebhooks share a common core structure but each class of webhook event also has its own payload contained in the eventData field.\r\n\r\nThe core structure of the webhook is as follows (in JSON)\r\n\r\n{\r\n    customer: string,   // the hostedsuite customer associated with the webhook\r\n    centerId: string,   // the ID of the center associated with this event\r\n    centerName: string, // the name of the center associated with this event\r\n    timestamp: string,  // ISO 8601 datetime stamp\r\n    eventId: string, // the ID associated with this particular webhook call / event, can be used for tracking whether a webhook event has been processed or not\r\n    eventName: string,  // the name of the event type e.g. ClientCreated, ReservationScheduled, etc.\r\n    eventData: object,  // the payload specific data for this event (see below)\r\n}\r\n\r\nWebhook eventData payloads (by class):\r\n\r\nClient eventData:\r\n\r\n{\r\n    clientId: string,   // the ID of the client associated with this event\r\n    clientName: string, // the name of the client associated with this event\r\n}\r\n\r\nReservation eventData:\r\n\r\n{\r\n    reservationId: string,  // the ID of the reservation associated with this event\r\n    meetingRoomId: string,  // the ID of the meeting room associated with this event\r\n}\r\n\r\nContact eventData:\r\n\r\n{\r\n    clientId: string,   // the ID of the client this contact is associated with\r\n    contactId: string,  // the ID of the contact associated with this event\r\n    contactName: string, // the name of the contact associated with this event\r\n}\r\n\r\nYou should use the associated IDs in the eventData object to retrieve the relevant data from the API\r\n\r\n\r\n    ")
export class ListWebhooks extends ListEntitiesRequest<WebhookInfo> implements IReturn<ListResponse<WebhookInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public url: string;

    public constructor(init?: Partial<ListWebhooks>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<WebhookInfo>(); }
    public getTypeName() { return 'ListWebhooks'; }
}

// @Route("/webhook/calls/{id}/reschedule", "POST")
export class RescheduleWebhook implements IReturnVoid
{
    public id: string;

    public constructor(init?: Partial<RescheduleWebhook>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'RescheduleWebhook'; }
}

// @Route("/webhookcalls/{id}", "GET")
export class GetWebhookCall implements IReturn<WebhookCallInfo>
{
    public id: string;

    public constructor(init?: Partial<GetWebhookCall>) { (Object as any).assign(this, init); }
    public createResponse() { return new WebhookCallInfo(); }
    public getTypeName() { return 'GetWebhookCall'; }
}

// @Route("/webhookcalls", "GET")
export class ListWebhookCalls extends ListEntitiesRequest<WebhookCallInfo> implements IReturn<ListResponse<WebhookCallInfo>>, IGet
{
    public dateCreated: DateRangeFilter;
    public webhookId: string;
    public event: WebhookEvents;
    public status: WebhookCallStatuses;

    public constructor(init?: Partial<ListWebhookCalls>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new ListResponse<WebhookCallInfo>(); }
    public getTypeName() { return 'ListWebhookCalls'; }
}

// @Route("/app/settings", "GET")
export class GetAppSettings implements IReturn<AppSettingsInfo>
{

    public constructor(init?: Partial<GetAppSettings>) { (Object as any).assign(this, init); }
    public createResponse() { return new AppSettingsInfo(); }
    public getTypeName() { return 'GetAppSettings'; }
}

// @Route("/dialing-rules")
export class GetDialingRules implements IReturn<GetDialingRulesResponse>
{

    public constructor(init?: Partial<GetDialingRules>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetDialingRulesResponse(); }
    public getTypeName() { return 'GetDialingRules'; }
}

// @Route("/roles")
export class ListRoles implements IReturn<ListRolesResponse>
{

    public constructor(init?: Partial<ListRoles>) { (Object as any).assign(this, init); }
    public createResponse() { return new ListRolesResponse(); }
    public getTypeName() { return 'ListRoles'; }
}

// @Route("/time-zones", "GET")
export class ListTimeZones implements IReturn<ListTimeZonesResponse>
{

    public constructor(init?: Partial<ListTimeZones>) { (Object as any).assign(this, init); }
    public createResponse() { return new ListTimeZonesResponse(); }
    public getTypeName() { return 'ListTimeZones'; }
}

