export interface Visitor {
  id: string;
  visitorName: string;
  phoneNumber: string;
  idNumber: string;
  refNumber?: string;
  residence: string;
  institutionOccupation: string;
  purposeOfVisit: string;
  timeIn: Date;
  timeOut?: Date;
  visitorType: 'foot' | 'vehicle';
  checkedInBy: string;
  checkedOutBy?: string;
  isCheckedOut: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
}

export interface Stats {
  totalVisitors: number;
  todayVisitors: number;
  activeVisitors: number;
  overdueVisitors: number;
  vehicleVisitors: number;
  footVisitors: number;
  checkedOutVisitors: number;
}