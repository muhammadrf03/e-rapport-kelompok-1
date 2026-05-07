export default function Loading() {
  return (
    <div className="container-fluid p-4">
      <div className="placeholder-glow">
        <div className="h2 placeholder col-4 mb-4 rounded"></div>
        <div className="row g-4">
          <div className="col-md-4"><div className="placeholder col-12 rounded-4" style={{ height: '150px' }}></div></div>
          <div className="col-md-4"><div className="placeholder col-12 rounded-4" style={{ height: '150px' }}></div></div>
          <div className="col-md-4"><div className="placeholder col-12 rounded-4" style={{ height: '150px' }}></div></div>
        </div>
        <div className="card mt-5 border-0 shadow-sm rounded-4">
          <div className="card-body p-5">
            <div className="placeholder col-12 mb-3"></div>
            <div className="placeholder col-10 mb-3"></div>
            <div className="placeholder col-11"></div>
          </div>
        </div>
      </div>
    </div>
  );
}